import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  /** Generate invoices for given students and fee structures. */
  async generateInvoice(
    tenantId: string,
    studentId: string,
    feeStructureIds: string[],
    dueDate: Date,
    notes?: string,
  ) {
    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { id: { in: feeStructureIds }, tenantId, isActive: true },
    });

    const amount = feeStructures.reduce((sum, f) => sum + Number(f.amount), 0);
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    return this.prisma.invoice.create({
      data: {
        tenantId,
        studentId,
        invoiceNumber,
        amount,
        totalAmount: amount,
        dueDate,
        notes,
        items: {
          create: feeStructures.map((f) => ({
            feeStructureId: f.id,
            description: f.name,
            amount: f.amount,
          })),
        },
      },
      include: { items: true, student: { select: { firstName: true, lastName: true } } },
    });
  }

  /** List invoices for a tenant with optional filters. */
  async findAll(
    tenantId: string,
    params: { status?: InvoiceStatus; studentId?: string; page?: number; limit?: number },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (params.status) where.status = params.status;
    if (params.studentId) where.studentId = params.studentId;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          items: true,
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /** Get a single invoice. */
  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { feeStructure: true } },
        payments: true,
        student: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  /** Get overdue invoices bucketed by aging. */
  async getDefaulters(tenantId: string) {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true,
            feeDefaulterRisk: { select: { riskCategory: true, riskScore: true } },
          },
        },
      },
    });

    const bucket = (invoice: typeof invoices[0]) => {
      const days = Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 30) return '0-30';
      if (days <= 60) return '31-60';
      return '60+';
    };

    const bucketed: Record<string, typeof invoices> = { '0-30': [], '31-60': [], '60+': [] };
    for (const inv of invoices) {
      bucketed[bucket(inv)].push(inv);
    }

    // Auto-update status to OVERDUE
    const overdueIds = invoices.map((i) => i.id);
    if (overdueIds.length > 0) {
      await this.prisma.invoice.updateMany({
        where: { id: { in: overdueIds }, status: 'PENDING' },
        data: { status: 'OVERDUE' },
      });
    }

    return bucketed;
  }

  /** Get financial summary dashboard for a tenant. */
  async getFinancialSummary(tenantId: string) {
    const [collected, outstanding, overdue] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: 'OVERDUE' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      collected: collected._sum.totalAmount ?? 0,
      outstanding: outstanding._sum.totalAmount ?? 0,
      overdue: overdue._sum.totalAmount ?? 0,
    };
  }
}
