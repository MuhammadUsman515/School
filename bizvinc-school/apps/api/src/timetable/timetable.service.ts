import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, classId?: string, teacherId?: string) {
    return this.prisma.forTenant(tenantId, async (tx) => {
      const data = await tx.timetableSlot.findMany({
        where: {
          tenantId,
          ...(classId ? { classId } : {}),
          ...(teacherId ? { teacherId } : {}),
        },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
        include: {
          subject: { select: { name: true, color: true } },
          teacher: { select: { firstName: true, lastName: true } },
          class: { select: { name: true, section: true } },
        },
      });
      return { data };
    });
  }

  async create(tenantId: string, dto: CreateSlotDto) {
    // Check teacher double-booking
    const conflict = await this.prisma.forTenant(tenantId, (tx) =>
      tx.timetableSlot.findFirst({
        where: {
          tenantId,
          teacherId: dto.teacherId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
        },
      }),
    );
    if (conflict) {
      throw new ConflictException('Teacher already has a class at this period');
    }

    return this.prisma.forTenant(tenantId, (tx) =>
      tx.timetableSlot.create({ data: { tenantId, ...dto } }),
    );
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.timetableSlot.delete({ where: { id } }),
    );
  }
}
