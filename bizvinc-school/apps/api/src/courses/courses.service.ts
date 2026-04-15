import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, search = '', page = 1, limit = 20) {
    const where = {
      tenantId,
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    };
    const [data, total] = await this.prisma.forTenant(tenantId, async (tx) => {
      const [d, t] = await Promise.all([
        tx.course.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            subject: { select: { name: true, color: true } },
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { modules: true, enrollments: true } },
          },
        }),
        tx.course.count({ where }),
      ]);
      return [d, t];
    });
    return {
      data: data.map((c: Record<string, unknown> & { _count: { modules: number; enrollments: number } }) => ({
        ...c,
        totalLessons: c._count.modules,
        enrolledCount: c._count.enrollments,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.course.findFirst({
        where: { id, tenantId },
        include: {
          subject: true,
          teacher: { select: { firstName: true, lastName: true } },
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                include: { completions: { select: { completedAt: true } } },
              },
            },
          },
        },
      }),
    );
  }

  async getModules(tenantId: string, courseId: string) {
    const data = await this.prisma.forTenant(tenantId, (tx) =>
      tx.courseModule.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { completions: { select: { completedAt: true } } },
          },
        },
      }),
    );
    return { data };
  }

  async create(tenantId: string, dto: CreateCourseDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.course.create({ data: { tenantId, ...dto } }),
    );
  }

  async addModule(tenantId: string, courseId: string, dto: CreateModuleDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.courseModule.create({ data: { courseId, ...dto } }),
    );
  }

  async addLesson(tenantId: string, moduleId: string, dto: CreateLessonDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.lesson.create({ data: { moduleId, ...dto } }),
    );
  }

  async completeLesson(tenantId: string, lessonId: string, studentId: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.lessonCompletion.upsert({
        where: { lessonId_studentId: { lessonId, studentId } },
        create: { lessonId, studentId, completedAt: new Date() },
        update: { completedAt: new Date() },
      }),
    );
  }
}
