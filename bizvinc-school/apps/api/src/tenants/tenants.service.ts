import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateTenantDto {
  name?: string;
  primaryColor?: string;
  logoUrl?: string;
  country?: string;
  currency?: string;
  timezone?: string;
}

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findOne(tenantId: string) {
    return this.prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({ where: { id: tenantId }, data: dto });
  }

  async getStats(tenantId: string) {
    const [students, staff, activeInvoices, classes] = await Promise.all([
      this.prisma.student.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.staff.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.invoice.count({ where: { tenantId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } } }),
      this.prisma.class.count({ where: { tenantId } }),
    ]);
    return { students, staff, activeInvoices, classes };
  }
}
