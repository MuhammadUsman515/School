import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, search = '', page = 1, limit = 20) {
    const where = {
      tenantId,
      status: 'ACTIVE' as const,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { employeeId: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.forTenant(tenantId, async (tx) => {
      const [d, t] = await Promise.all([
        tx.staff.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          include: { user: { select: { email: true, avatarUrl: true } } },
        }),
        tx.staff.count({ where }),
      ]);
      return [d, t];
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.staff.findFirst({
        where: { id, tenantId },
        include: {
          user: { select: { email: true, avatarUrl: true } },
          subjects: { select: { name: true, color: true } },
        },
      }),
    );
  }

  async create(tenantId: string, dto: CreateStaffDto) {
    const { email, ...rest } = dto;
    return this.prisma.forTenant(tenantId, async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'TEACHER',
          passwordHash: 'CHANGE_ME',
        },
      });
      return tx.staff.create({
        data: { tenantId, userId: user.id, status: 'ACTIVE', ...rest },
      });
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateStaffDto>) {
    const { email: _email, ...rest } = dto;
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.staff.update({ where: { id }, data: rest }),
    );
  }

  async deactivate(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.staff.update({ where: { id }, data: { status: 'INACTIVE' } }),
    );
  }
}
