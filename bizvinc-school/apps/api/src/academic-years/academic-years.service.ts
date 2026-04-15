import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto, CreateTermDto } from './dto/create-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.academicYear.findMany({
        where: { tenantId },
        orderBy: { startDate: 'desc' },
        include: { terms: { orderBy: { startDate: 'asc' } } },
      }),
    );
  }

  async getCurrent(tenantId: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.academicYear.findFirst({
        where: { tenantId, isCurrent: true },
        include: {
          terms: { orderBy: { startDate: 'asc' } },
        },
      }),
    );
  }

  async create(tenantId: string, dto: CreateAcademicYearDto) {
    if (dto.isCurrent) {
      await this.prisma.forTenant(tenantId, (tx) =>
        tx.academicYear.updateMany({
          where: { tenantId, isCurrent: true },
          data: { isCurrent: false },
        }),
      );
    }
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.academicYear.create({
        data: {
          tenantId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          isCurrent: dto.isCurrent ?? false,
        },
      }),
    );
  }

  async addTerm(tenantId: string, academicYearId: string, dto: CreateTermDto) {
    // Get the next order number
    return this.prisma.forTenant(tenantId, async (tx) => {
      const existingTerms = await tx.term.findMany({ where: { academicYearId, tenantId } });
      return tx.term.create({
        data: {
          academicYearId,
          tenantId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          order: existingTerms.length + 1,
        },
      });
    });
  }

  async setCurrentYear(tenantId: string, id: string) {
    await this.prisma.forTenant(tenantId, (tx) =>
      tx.academicYear.updateMany({
        where: { tenantId },
        data: { isCurrent: false },
      }),
    );
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.academicYear.update({ where: { id }, data: { isCurrent: true } }),
    );
  }
}
