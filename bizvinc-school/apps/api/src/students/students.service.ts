import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  /** List all students for a tenant with pagination and search. */
  async findAll(tenantId: string, params: {
    page?: number; limit?: number; search?: string; classId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { admissionNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.classId) {
      where.classes = { some: { classId: params.classId, isActive: true } };
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true, phone: true, avatarUrl: true } },
          classes: {
            where: { isActive: true },
            include: { class: { select: { name: true, grade: true, section: true } } },
          },
          feeDefaulterRisk: { select: { riskCategory: true, riskScore: true } },
        },
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Get a single student's full profile. */
  async findOne(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { email: true, phone: true, avatarUrl: true, fcmTokens: true } },
        classes: {
          include: { class: { include: { academicYear: true } } },
        },
        parents: {
          include: {
            parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        feeDefaulterRisk: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  /** Create a new student with an associated user account. */
  async create(tenantId: string, dto: CreateStudentDto) {
    const admissionNumber = await this.generateAdmissionNumber(tenantId);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const student = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email,
          passwordHash,
          role: 'STUDENT',
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      return tx.student.create({
        data: {
          tenantId,
          userId: user.id,
          admissionNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          nationality: dto.nationality,
          religion: dto.religion,
          bloodGroup: dto.bloodGroup,
          address: dto.address,
          city: dto.city,
          medicalNotes: dto.medicalNotes,
          allergies: dto.allergies || [],
          ...(dto.classId && {
            classes: { create: { classId: dto.classId } },
          }),
        },
        include: { user: { select: { email: true } } },
      });
    });

    return student;
  }

  /** Update a student's profile. */
  async update(tenantId: string, id: string, dto: Partial<CreateStudentDto>) {
    await this.findOne(tenantId, id);

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationality: dto.nationality,
        religion: dto.religion,
        bloodGroup: dto.bloodGroup,
        address: dto.address,
        city: dto.city,
        medicalNotes: dto.medicalNotes,
        allergies: dto.allergies,
      },
    });
  }

  /** Soft-delete a student by setting status to INACTIVE. */
  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  /** Get a student's attendance summary within a date range. */
  async getAttendance(tenantId: string, studentId: string, startDate: Date, endDate: Date) {
    await this.findOne(tenantId, studentId);

    const records = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        studentId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) =>
      ['ABSENT_EXCUSED', 'ABSENT_UNEXCUSED'].includes(r.status),
    ).length;

    return {
      records,
      summary: {
        total,
        present,
        absent,
        late: records.filter((r) => r.status === 'LATE').length,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      },
    };
  }

  /** Get all grades for a student. */
  async getGrades(tenantId: string, studentId: string) {
    await this.findOne(tenantId, studentId);

    return this.prisma.grade.findMany({
      where: { tenantId, studentId },
      include: {
        subject: { select: { name: true, color: true } },
        term: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { gradedAt: 'desc' },
    });
  }

  /** Get all invoices for a student. */
  async getInvoices(tenantId: string, studentId: string) {
    await this.findOne(tenantId, studentId);

    return this.prisma.invoice.findMany({
      where: { tenantId, studentId },
      include: { items: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private async generateAdmissionNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count({ where: { tenantId } });
    return `${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
