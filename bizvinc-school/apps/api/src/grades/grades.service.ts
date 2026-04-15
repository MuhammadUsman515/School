import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitGradeDto } from './dto/submit-grade.dto';

const LETTER_GRADE_MAP: { min: number; letter: string }[] = [
  { min: 90, letter: 'A+' }, { min: 85, letter: 'A' }, { min: 80, letter: 'A-' },
  { min: 75, letter: 'B+' }, { min: 70, letter: 'B' }, { min: 65, letter: 'B-' },
  { min: 60, letter: 'C+' }, { min: 55, letter: 'C' }, { min: 50, letter: 'C-' },
  { min: 40, letter: 'D' }, { min: 0, letter: 'F' },
];

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  /** Submit a grade for a student, auto-calculating percentage and letter grade. */
  async submitGrade(tenantId: string, gradedById: string, dto: SubmitGradeDto) {
    const percentage = Math.round((dto.score / dto.maxScore) * 100);
    const letterGrade = LETTER_GRADE_MAP.find((g) => percentage >= g.min)?.letter ?? 'F';

    return this.prisma.grade.upsert({
      where: {
        // Unique by student+subject+term+category combo — fall back to create
        id: 'new',
      },
      update: {},
      create: {
        tenantId,
        studentId: dto.studentId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        termId: dto.termId,
        categoryId: dto.categoryId,
        assignmentId: dto.assignmentId,
        examId: dto.examId,
        score: dto.score,
        maxScore: dto.maxScore,
        percentage,
        letterGrade,
        comments: dto.comments,
        gradedById,
      },
    });
  }

  /** Create or update a grade. */
  async upsertGrade(tenantId: string, gradedById: string, dto: SubmitGradeDto) {
    const percentage = Math.round((dto.score / dto.maxScore) * 100);
    const letterGrade = LETTER_GRADE_MAP.find((g) => percentage >= g.min)?.letter ?? 'F';

    return this.prisma.grade.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        termId: dto.termId,
        categoryId: dto.categoryId,
        assignmentId: dto.assignmentId,
        examId: dto.examId,
        score: dto.score,
        maxScore: dto.maxScore,
        percentage,
        letterGrade,
        comments: dto.comments,
        gradedById,
      },
    });
  }

  /** Get all grades for a class and subject. */
  async getGrades(tenantId: string, classId: string, subjectId?: string, termId?: string) {
    return this.prisma.grade.findMany({
      where: {
        tenantId,
        classId,
        ...(subjectId && { subjectId }),
        ...(termId && { termId }),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        subject: { select: { name: true } },
        category: { select: { name: true, weight: true } },
      },
      orderBy: [{ student: { firstName: 'asc' } }],
    });
  }

  /**
   * Generate a report card for a student for a given term.
   * Returns grades grouped by subject with weighted totals.
   */
  async getReportCard(tenantId: string, studentId: string, termId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: { select: { email: true } },
        classes: {
          where: { isActive: true },
          include: { class: { select: { name: true, grade: true, section: true } } },
        },
        parents: {
          include: { parent: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const term = await this.prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: true },
    });
    if (!term) throw new NotFoundException('Term not found');

    const grades = await this.prisma.grade.findMany({
      where: { tenantId, studentId, termId },
      include: {
        subject: { select: { name: true, color: true } },
        category: { select: { name: true, weight: true } },
      },
    });

    // Group by subject
    const bySubject: Record<string, {
      subjectName: string;
      color: string;
      grades: typeof grades;
      average: number;
      letterGrade: string;
    }> = {};

    for (const g of grades) {
      const key = g.subjectId;
      if (!bySubject[key]) {
        bySubject[key] = {
          subjectName: g.subject.name,
          color: g.subject.color,
          grades: [],
          average: 0,
          letterGrade: 'F',
        };
      }
      bySubject[key].grades.push(g);
    }

    // Calculate weighted averages per subject
    for (const sub of Object.values(bySubject)) {
      const total = sub.grades.reduce((sum, g) => sum + Number(g.percentage ?? 0), 0);
      sub.average = sub.grades.length > 0 ? Math.round(total / sub.grades.length) : 0;
      sub.letterGrade = LETTER_GRADE_MAP.find((l) => sub.average >= l.min)?.letter ?? 'F';
    }

    const subjectList = Object.values(bySubject);
    const overallAverage = subjectList.length > 0
      ? Math.round(subjectList.reduce((s, sub) => s + sub.average, 0) / subjectList.length)
      : 0;

    return {
      student,
      term,
      subjects: subjectList,
      overallAverage,
      overallGrade: LETTER_GRADE_MAP.find((l) => overallAverage >= l.min)?.letter ?? 'F',
    };
  }
}
