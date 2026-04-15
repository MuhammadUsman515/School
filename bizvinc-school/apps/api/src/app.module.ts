import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradesModule } from './grades/grades.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { WebsocketModule } from './websocket/websocket.module';
// New modules
import { AdmissionsModule } from './admissions/admissions.module';
import { CoursesModule } from './courses/courses.module';
import { ExamsModule } from './exams/exams.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';
import { TimetableModule } from './timetable/timetable.module';
import { StaffModule } from './staff/staff.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { ChatModule } from './chat/chat.module';
import { UploadsModule } from './uploads/uploads.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Core
    AuthModule,
    StudentsModule,
    ClassesModule,
    StaffModule,
    SubjectsModule,
    AcademicYearsModule,
    // Academic
    AttendanceModule,
    GradesModule,
    AssignmentsModule,
    ExamsModule,
    CoursesModule,
    TimetableModule,
    // Finance
    InvoicesModule,
    PaymentsModule,
    FeeStructuresModule,
    // Communication
    AnnouncementsModule,
    NotificationsModule,
    ChatModule,
    // AI
    AiModule,
    // Admin
    AdmissionsModule,
    TenantsModule,
    UsersModule,
    UploadsModule,
    // Real-time
    WebsocketModule,
  ],
})
export class AppModule {}
