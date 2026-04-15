import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';

const DAY_MAP: Record<string, number> = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
  FRIDAY: 5, SATURDAY: 6, SUNDAY: 7,
};

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
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          class: { select: { name: true, section: true } },
        },
      });
      return { data };
    });
  }

  async create(tenantId: string, dto: CreateSlotDto) {
    // Check teacher double-booking
    const dayNum = DAY_MAP[dto.dayOfWeek] ?? 1;
    const conflict = await this.prisma.forTenant(tenantId, (tx) =>
      tx.timetableSlot.findFirst({
        where: {
          tenantId,
          teacherId: dto.teacherId,
          dayOfWeek: dayNum,
          periodNumber: dto.periodNumber,
        },
      }),
    );
    if (conflict) {
      throw new ConflictException('Teacher already has a class at this period');
    }

    return this.prisma.forTenant(tenantId, (tx) =>
      tx.timetableSlot.create({
        data: {
          tenantId,
          classId: dto.classId,
          subjectId: dto.subjectId,
          teacherId: dto.teacherId,
          dayOfWeek: dayNum,
          periodNumber: dto.periodNumber,
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      }),
    );
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.timetableSlot.delete({ where: { id } }),
    );
  }
}
