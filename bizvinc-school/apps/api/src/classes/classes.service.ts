import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateClassDto {
  academicYearId: string;
  name: string;
  grade: string;
  section: string;
  capacity?: number;
  roomNumber?: string;
  classTeacherId?: string;
}

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, academicYearId?: string) {
    return this.prisma.class.findMany({
      where: { tenantId, ...(academicYearId && { academicYearId }) },
      include: {
        _count: { select: { students: true } },
        timetableSlots: { where: { isActive: true }, take: 1 },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const cls = await this.prisma.class.findFirst({
      where: { id, tenantId },
      include: {
        students: {
          where: { isActive: true },
          include: { student: { include: { user: { select: { email: true } } } } },
        },
        timetableSlots: {
          where: { isActive: true },
          include: { subject: true, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
        },
      },
    });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async create(tenantId: string, dto: CreateClassDto) {
    return this.prisma.class.create({
      data: { tenantId, ...dto },
    });
  }

  async getStudents(tenantId: string, classId: string) {
    return this.prisma.studentClass.findMany({
      where: { classId, isActive: true },
      include: {
        student: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
            feeDefaulterRisk: { select: { riskCategory: true } },
          },
        },
      },
      orderBy: { student: { firstName: 'asc' } },
    });
  }
}
