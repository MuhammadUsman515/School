import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Mark attendance for an entire class in a single bulk operation.
   * Triggers async parent notifications for absent students.
   */
  async markClassAttendance(
    tenantId: string,
    markedById: string,
    dto: MarkAttendanceDto,
  ) {
    const date = new Date(dto.date);

    // Upsert each attendance record
    await this.prisma.$transaction(
      dto.records.map((rec) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_classId_date_period: {
              studentId: rec.studentId,
              classId: dto.classId,
              date,
              period: dto.period ?? 0,
            },
          },
          update: { status: rec.status, notes: rec.notes, markedById, markedAt: new Date() },
          create: {
            tenantId,
            studentId: rec.studentId,
            classId: dto.classId,
            date,
            period: dto.period,
            status: rec.status,
            notes: rec.notes,
            markedById,
          },
        }),
      ),
    );

    // Fire-and-forget: notify parents of absent students
    const absentStudents = dto.records.filter(
      (r) => r.status === 'ABSENT_UNEXCUSED' || r.status === 'ABSENT_EXCUSED',
    );
    this.sendAbsenceNotifications(tenantId, absentStudents.map((r) => r.studentId), date).catch(
      () => { /* non-blocking */ },
    );

    return { marked: dto.records.length, absences: absentStudents.length };
  }

  /**
   * Get attendance records for a class on a given date.
   */
  async getClassAttendance(tenantId: string, classId: string, date: Date) {
    return this.prisma.attendance.findMany({
      where: { tenantId, classId, date },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { student: { firstName: 'asc' } },
    });
  }

  /**
   * Generate a class attendance report for a given month.
   */
  async getClassReport(tenantId: string, classId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.prisma.attendance.findMany({
      where: { tenantId, classId, date: { gte: startDate, lte: endDate } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
    });

    // Group by student
    const byStudent: Record<string, { student: typeof records[0]['student']; present: number; absent: number; late: number; total: number }> = {};
    for (const r of records) {
      if (!byStudent[r.studentId]) {
        byStudent[r.studentId] = { student: r.student, present: 0, absent: 0, late: 0, total: 0 };
      }
      byStudent[r.studentId].total++;
      if (r.status === 'PRESENT') byStudent[r.studentId].present++;
      else if (r.status === 'LATE') byStudent[r.studentId].late++;
      else byStudent[r.studentId].absent++;
    }

    return Object.values(byStudent).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));
  }

  /**
   * Get students whose attendance has dropped below the given threshold.
   */
  async getAttendanceAlerts(tenantId: string, thresholdPercent = 75) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const records = await this.prisma.attendance.findMany({
      where: { tenantId, date: { gte: thirtyDaysAgo } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const byStudent: Record<string, { student: typeof records[0]['student']; present: number; total: number }> = {};
    for (const r of records) {
      if (!byStudent[r.studentId]) {
        byStudent[r.studentId] = { student: r.student, present: 0, total: 0 };
      }
      byStudent[r.studentId].total++;
      if (r.status === 'PRESENT') byStudent[r.studentId].present++;
    }

    return Object.values(byStudent)
      .map((s) => ({ ...s, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 }))
      .filter((s) => s.percentage < thresholdPercent)
      .sort((a, b) => a.percentage - b.percentage);
  }

  private async sendAbsenceNotifications(
    tenantId: string,
    studentIds: string[],
    date: Date,
  ) {
    for (const studentId of studentIds) {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          parents: {
            include: { parent: { select: { id: true, firstName: true } } },
          },
        },
      });
      if (!student) continue;

      for (const ps of student.parents) {
        await this.notifications.sendToUser(ps.parent.id, tenantId, {
          title: 'Absence Alert',
          body: `${student.firstName} ${student.lastName} was marked absent on ${date.toDateString()}.`,
          type: 'ATTENDANCE_ABSENT',
          data: { studentId, date: date.toISOString() },
        });
      }
    }
  }
}
