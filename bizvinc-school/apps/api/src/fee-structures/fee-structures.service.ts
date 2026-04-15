import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';

@Injectable()
export class FeeStructuresService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, classId?: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.findMany({
        where: { tenantId, isActive: true, ...(classId ? { classId } : {}) },
        orderBy: [{ feeType: 'asc' }, { name: 'asc' }],
        include: { class: { select: { name: true } }, academicYear: { select: { name: true } } },
      }),
    );
  }

  async create(tenantId: string, dto: CreateFeeStructureDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.create({
        data: { tenantId, isActive: true, ...dto },
      }),
    );
  }

  async update(tenantId: string, id: string, dto: Partial<CreateFeeStructureDto>) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.update({ where: { id }, data: dto }),
    );
  }

  async deactivate(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.update({ where: { id }, data: { isActive: false } }),
    );
  }
}
