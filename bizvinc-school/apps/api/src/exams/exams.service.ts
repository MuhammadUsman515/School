import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, AddExamQuestionsDto, UpdateExamStatusDto, SubmitExamResultDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string, page = 1, limit = 20) {
    const where = { tenantId, ...(status ? { status } : {}) };
    const [data, total] = await this.prisma.forTenant(tenantId, async (tx) => {
      const [d, t] = await Promise.all([
        tx.exam.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true, color: true } },
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
          class: true,
          subject: true,
          questions: {
            orderBy: { order: 'asc' },
            include: { questionBank: true },
          },
          results: {
            include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
          },
        },
      }),
    );
  }

  async create(tenantId: string, dto: CreateExamDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.exam.create({
        data: { tenantId, status: 'DRAFT', ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined },
      }),
    );
  }

  async addQuestions(tenantId: string, examId: string, dto: AddExamQuestionsDto) {
    return this.prisma.forTenant(tenantId, async (tx) => {
      const exam = await tx.exam.findFirst({ where: { id: examId, tenantId }, include: { questions: true } });
      const startOrder = exam?.questions.length ?? 0;
      const questions = dto.questionBankItemIds.map((qbId, i) => ({
        examId,
        questionBankItemId: qbId,
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
        create: { examId, studentId: dto.studentId, marksObtained: dto.marksObtained, remarks: dto.remarks },
        update: { marksObtained: dto.marksObtained, remarks: dto.remarks },
      }),
    );
  }
}
