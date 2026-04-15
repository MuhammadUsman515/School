import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, AddExamQuestionsDto, UpdateExamStatusDto, SubmitExamResultDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string, page = 1, limit = 20) {
    const where = { tenantId, ...(status ? { status: status as never } : {}) };
    const [data, total] = await this.prisma.forTenant(tenantId, async (tx) => {
      const [d, t] = await Promise.all([
        tx.exam.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            term: { select: { name: true } },
          },
        }),
        tx.exam.count({ where }),
      ]);
      return [d, t];
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.exam.findFirst({
        where: { id, tenantId },
        include: {
          term: true,
          questions: {
            orderBy: { order: 'asc' },
            include: { question: true },
          },
          results: {
            include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
          },
        },
      }),
    );
  }

  async create(tenantId: string, dto: CreateExamDto) {
    const startTime = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date();
    const endTime = new Date(startTime.getTime() + (dto.durationMinutes ?? 60) * 60 * 1000);

    return this.prisma.forTenant(tenantId, async (tx) => {
      // Get or create a term to associate with
      let termId = dto.termId;
      if (!termId) {
        const academicYear = await tx.academicYear.findFirst({ where: { tenantId, isCurrent: true } });
        if (academicYear) {
          const term = await tx.term.findFirst({ where: { tenantId, academicYearId: academicYear.id } });
          termId = term?.id;
        }
      }
      if (!termId) throw new Error('No term available. Please create an academic year and term first.');

      return tx.exam.create({
        data: {
          tenantId,
          termId,
          classId: dto.classId,
          subjectId: dto.subjectId,
          title: dto.title,
          description: dto.instructions,
          totalMarks: dto.totalMarks ?? 100,
          passingMarks: dto.passingMarks ?? 40,
          durationMinutes: dto.durationMinutes ?? 60,
          startTime,
          endTime,
          status: 'DRAFT',
        },
      });
    });
  }

  async addQuestions(tenantId: string, examId: string, dto: AddExamQuestionsDto) {
    return this.prisma.forTenant(tenantId, async (tx) => {
      const exam = await tx.exam.findFirst({ where: { id: examId, tenantId }, include: { questions: true } });
      const startOrder = exam?.questions.length ?? 0;
      const questions = dto.questionBankItemIds.map((qId, i) => ({
        examId,
        questionId: qId,
        order: startOrder + i + 1,
        marks: 1,
      }));
      return tx.examQuestion.createMany({ data: questions });
    });
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateExamStatusDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.exam.update({ where: { id }, data: { status: dto.status as never } }),
    );
  }

  async submitResult(tenantId: string, examId: string, dto: SubmitExamResultDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.examResult.upsert({
        where: { examId_studentId: { examId, studentId: dto.studentId } },
        create: {
          examId,
          studentId: dto.studentId,
          answers: {},
          score: dto.marksObtained,
        },
        update: { score: dto.marksObtained },
      }),
    );
  }
}
