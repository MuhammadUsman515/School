import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdmissionDto, UpdateAdmissionStatusDto } from './dto/create-admission.dto';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAdmissionDto) {
    const applicationNumber = `ADM-${Date.now()}`;
    const nameParts = dto.applicantName.trim().split(' ');
    const firstName = nameParts[0] ?? dto.applicantName;
    const lastName = nameParts.slice(1).join(' ') || '-';

    return this.prisma.forTenant(tenantId, (tx) =>
      tx.admission.create({
        data: {
          tenantId,
          applicationNumber,
          firstName,
          lastName,
          dateOfBirth: new Date('2000-01-01'),
          gender: 'OTHER',
          guardianName: dto.applicantName,
          guardianEmail: dto.applicantEmail,
          guardianPhone: dto.applicantPhone ?? '',
          appliedGrade: dto.appliedGrade ?? '',
          academicYearId: dto.academicYearId,
          notes: dto.notes,
        },
      }),
    );
  }

  async findAll(tenantId: string, status?: string, page = 1, limit = 20) {
    const where = { tenantId, ...(status ? { status: status as never } : {}) };
    const [data, total] = await this.prisma.forTenant(tenantId, async (tx) => {
      const [d, t] = await Promise.all([
        tx.admission.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        tx.admission.count({ where }),
      ]);
      return [d, t];
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCounts(tenantId: string) {
    const statuses = ['INQUIRY','APPLIED','DOCUMENTS_PENDING','SHORTLISTED','ACCEPTED','ENROLLED','REJECTED','WAITLISTED','WITHDRAWN'];
    const counts: Record<string, number> = {};
    await this.prisma.forTenant(tenantId, async (tx) => {
      for (const s of statuses) {
        counts[s] = await tx.admission.count({ where: { tenantId, status: s as never } });
      }
    });
    return counts;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateAdmissionStatusDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.admission.update({
        where: { id },
        data: { status: dto.status as never, notes: dto.notes },
      }),
    );
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.admission.delete({ where: { id } }),
    );
  }
}
