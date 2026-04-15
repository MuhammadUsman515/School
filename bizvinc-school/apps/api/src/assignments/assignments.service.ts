import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionType, LatePolicy } from '@prisma/client';

export class CreateAssignmentDto {
  classId: string;
  subjectId?: string;
  title: string;
  description?: string;
  attachmentUrls?: string[];
  dueDate: string;
  maxScore: number;
  submissionType?: SubmissionType;
  latePolicy?: LatePolicy;
}

export class SubmitAssignmentDto {
  content?: string;
  fileUrls?: string[];
  linkUrl?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, teacherId: string, dto: CreateAssignmentDto) {
    const staffRecord = await this.prisma.staff.findFirst({ where: { userId: teacherId, tenantId } });
    if (!staffRecord) throw new NotFoundException('Staff record not found');

    return this.prisma.assignment.create({
      data: {
        tenantId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: staffRecord.id,
        title: dto.title,
        description: dto.description,
        attachmentUrls: dto.attachmentUrls || [],
        dueDate: new Date(dto.dueDate),
        maxScore: dto.maxScore,
        submissionType: dto.submissionType || 'FILE_UPLOAD',
        latePolicy: dto.latePolicy || 'ACCEPT_WITH_PENALTY',
        isPublished: true,
      },
    });
  }

  async findAll(tenantId: string, classId?: string, teacherUserId?: string) {
    const where: Record<string, unknown> = { tenantId, isPublished: true };
    if (classId) where.classId = classId;
    if (teacherUserId) {
      const staff = await this.prisma.staff.findFirst({ where: { userId: teacherUserId, tenantId } });
      if (staff) where.teacherId = staff.id;
    }
    return this.prisma.assignment.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async submitAssignment(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const isLate = new Date() > assignment.dueDate;
    if (isLate && assignment.latePolicy === 'BLOCK_AFTER_DEADLINE') {
      throw new BadRequestException('Submission deadline has passed');
    }

    const studentRecord = await this.prisma.student.findFirst({ where: { userId: studentId } });
    if (!studentRecord) throw new NotFoundException('Student record not found');

    return this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: studentRecord.id } },
      update: {
        content: dto.content,
        fileUrls: dto.fileUrls || [],
        linkUrl: dto.linkUrl,
        submittedAt: new Date(),
        isLate,
        status: 'SUBMITTED',
      },
      create: {
        assignmentId,
        studentId: studentRecord.id,
        content: dto.content,
        fileUrls: dto.fileUrls || [],
        linkUrl: dto.linkUrl,
        isLate,
        status: 'SUBMITTED',
      },
    });
  }

  async getSubmissions(tenantId: string, assignmentId: string) {
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(submissionId: string, score: number, feedback: string, gradedById: string) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { score, feedback, gradedAt: new Date(), gradedById, status: 'GRADED' },
    });
  }
}
