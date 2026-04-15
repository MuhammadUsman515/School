/**
 * Bizvinc School — Database Seed Script
 * Creates a fully populated demo school with students, classes, grades,
 * invoices, attendance, and AI knowledge base entries.
 *
 * Run: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding Bizvinc School demo data...\n');

  // ─── 1. Tenant ──────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Bizvinc Demo School',
      slug: 'demo',
      plan: 'GROWTH',
      country: 'PK',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      primaryColor: '#7D35CA',
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Admin User ──────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.bizvincdemo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.bizvincdemo.com',
      passwordHash: await hash('Demo@12345'),
      role: 'SCHOOL_ADMIN',
      firstName: 'Muhammad',
      lastName: 'Usman',
      emailVerified: true,
    },
  });
  console.log(`✅ Admin: ${adminUser.email}`);

  // ─── 3. Academic Year & Terms ───────────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { id: `00000000-0000-0000-0000-000000000001` },
    update: {},
    create: {
      id: `00000000-0000-0000-0000-000000000001`,
      tenantId: tenant.id,
      name: '2025-2026',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
    },
  });

  const terms = await Promise.all([
    { name: 'Term 1', start: '2025-04-01', end: '2025-07-31', order: 1 },
    { name: 'Term 2', start: '2025-08-01', end: '2025-11-30', order: 2 },
    { name: 'Term 3', start: '2025-12-01', end: '2026-03-31', order: 3 },
  ].map(async (t, idx) =>
    prisma.term.upsert({
      where: { id: `00000000-0000-0000-0001-00000000000${idx + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000000${idx + 1}`,
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        name: t.name,
        startDate: new Date(t.start),
        endDate: new Date(t.end),
        order: t.order,
      },
    }),
  ));
  console.log(`✅ Academic year with ${terms.length} terms`);

  // ─── 4. Subjects ────────────────────────────────────────────
  const subjectData = [
    { name: 'Mathematics', code: 'MATH', color: '#3B82F6' },
    { name: 'English', code: 'ENG', color: '#10B981' },
    { name: 'Science', code: 'SCI', color: '#F59E0B' },
    { name: 'Social Studies', code: 'SS', color: '#8B5CF6' },
    { name: 'Urdu', code: 'URD', color: '#EC4899' },
    { name: 'Computer Science', code: 'CS', color: '#06B6D4' },
  ];

  const subjects = await Promise.all(
    subjectData.map((s) =>
      prisma.subject.create({
        data: { tenantId: tenant.id, ...s },
      }),
    ),
  );
  console.log(`✅ ${subjects.length} subjects created`);

  // ─── 5. Classes ─────────────────────────────────────────────
  const classData = [
    { name: 'Grade 6-A', grade: 'Grade 6', section: 'A' },
    { name: 'Grade 7-A', grade: 'Grade 7', section: 'A' },
    { name: 'Grade 8-A', grade: 'Grade 8', section: 'A' },
    { name: 'Grade 9-A', grade: 'Grade 9', section: 'A' },
    { name: 'Grade 10-A', grade: 'Grade 10', section: 'A' },
  ];

  const classes = await Promise.all(
    classData.map((c) =>
      prisma.class.create({
        data: { tenantId: tenant.id, academicYearId: academicYear.id, ...c, capacity: 30 },
      }),
    ),
  );
  console.log(`✅ ${classes.length} classes created`);

  // ─── 6. Teachers (Staff + Users) ────────────────────────────
  const teacherNames = [
    { first: 'Aisha', last: 'Khan' },
    { first: 'Bilal', last: 'Ahmed' },
    { first: 'Sana', last: 'Malik' },
    { first: 'Farhan', last: 'Qureshi' },
    { first: 'Nadia', last: 'Hassan' },
  ];

  const teachers: { staffId: string; userId: string }[] = [];
  for (let i = 0; i < teacherNames.length; i++) {
    const { first, last } = teacherNames[i];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@demo.bizvincdemo.com`;

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash: await hash('Teacher@12345'),
        role: 'TEACHER',
        firstName: first,
        lastName: last,
        emailVerified: true,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        employeeId: `T${String(i + 1).padStart(3, '0')}`,
        designation: 'Teacher',
        department: 'Academics',
        joiningDate: new Date('2023-04-01'),
        salary: 60000,
      },
    });

    teachers.push({ staffId: staff.id, userId: user.id });
  }
  console.log(`✅ ${teachers.length} teachers created`);

  // ─── 7. Fee Structures ──────────────────────────────────────
  const feeStructures = await Promise.all([
    { name: 'Tuition Fee', amount: 12000, frequency: 'MONTHLY' as const, feeType: 'TUITION' as const },
    { name: 'Activity Fee', amount: 2000, frequency: 'MONTHLY' as const, feeType: 'ACTIVITY' as const },
    { name: 'Computer Lab Fee', amount: 1500, frequency: 'MONTHLY' as const, feeType: 'LAB' as const },
  ].map((f) =>
    prisma.feeStructure.create({
      data: { tenantId: tenant.id, ...f, applicableGrades: [] },
    }),
  ));
  console.log(`✅ ${feeStructures.length} fee structures`);

  // ─── 8. Students (50 students across classes) ───────────────
  const firstNames = ['Ali', 'Zara', 'Omar', 'Fatima', 'Ahmed', 'Hina', 'Hamza', 'Ayesha', 'Usman', 'Sara'];
  const lastNames = ['Khan', 'Ahmed', 'Malik', 'Qureshi', 'Hassan', 'Ali', 'Sheikh', 'Chaudhry', 'Iqbal', 'Baig'];

  let studentCount = 0;
  for (const cls of classes) {
    for (let j = 0; j < 10; j++) {
      const firstName = firstNames[(studentCount + j) % firstNames.length];
      const lastName = lastNames[(studentCount + j) % lastNames.length] + String(studentCount + j);
      const admNo = `2025-${String(studentCount + j + 1).padStart(4, '0')}`;

      const parentUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `parent.${admNo}@demo.bizvincdemo.com`,
          passwordHash: await hash('Parent@12345'),
          role: 'PARENT',
          firstName: `${firstName} (Parent)`,
          lastName: lastName,
        },
      });

      const studentUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `student.${admNo}@demo.bizvincdemo.com`,
          passwordHash: await hash('Student@12345'),
          role: 'STUDENT',
          firstName,
          lastName,
        },
      });

      const student = await prisma.student.create({
        data: {
          tenantId: tenant.id,
          userId: studentUser.id,
          admissionNumber: admNo,
          firstName,
          lastName,
          dateOfBirth: new Date(`${2010 + (j % 5)}-0${(j % 9) + 1}-15`),
          gender: j % 2 === 0 ? 'MALE' : 'FEMALE',
          classes: { create: { classId: cls.id, rollNumber: String(j + 1) } },
          parents: {
            create: { parentUserId: parentUser.id, relationship: 'FATHER', isPrimary: true },
          },
        },
      });

      // Generate 3 months of invoices per student
      for (let m = 0; m < 3; m++) {
        const dueDate = new Date(2025, 3 + m, 10); // April–June 2025
        const isPaid = Math.random() > 0.2; // 80% paid

        const invoice = await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            studentId: student.id,
            invoiceNumber: `INV-${student.admissionNumber}-${m + 1}`,
            amount: 15500,
            totalAmount: 15500,
            paidAmount: isPaid ? 15500 : 0,
            status: isPaid ? 'PAID' : (dueDate < new Date() ? 'OVERDUE' : 'PENDING'),
            dueDate,
            paidAt: isPaid ? new Date(dueDate.getTime() + Math.random() * 10 * 86400000) : null,
            items: {
              create: feeStructures.map((f) => ({
                feeStructureId: f.id,
                description: f.name,
                amount: Number(f.amount),
              })),
            },
          },
        });
      }
    }
    studentCount += 10;
  }
  console.log(`✅ ${studentCount} students with invoices and parent accounts`);

  // ─── 9. Sample Attendance (past 2 months) ───────────────────
  const allStudents = await prisma.student.findMany({ where: { tenantId: tenant.id } });
  const attendanceRecords: object[] = [];
  const now = new Date();

  for (let d = 60; d >= 1; d--) {
    const date = new Date(now.getTime() - d * 86400000);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    for (const student of allStudents) {
      const sc = await prisma.studentClass.findFirst({ where: { studentId: student.id, isActive: true } });
      if (!sc) continue;

      const roll = Math.random();
      const status = roll < 0.85 ? 'PRESENT' : roll < 0.92 ? 'ABSENT_UNEXCUSED' : 'LATE';
      attendanceRecords.push({
        tenantId: tenant.id,
        studentId: student.id,
        classId: sc.classId,
        date,
        status,
        markedById: adminUser.id,
      });
    }
  }

  await prisma.attendance.createMany({ data: attendanceRecords as never[], skipDuplicates: true });
  console.log(`✅ ${attendanceRecords.length} attendance records created`);

  // ─── 10. Sample Grades ──────────────────────────────────────
  for (const student of allStudents.slice(0, 20)) {
    for (const subject of subjects) {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      const pct = score;
      const letters = ['F', 'D', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
      const letter = letters[Math.min(Math.floor(pct / 10), 9)];

      await prisma.grade.create({
        data: {
          tenantId: tenant.id,
          studentId: student.id,
          classId: (await prisma.studentClass.findFirst({ where: { studentId: student.id } }))!.classId,
          subjectId: subject.id,
          termId: terms[0].id,
          score,
          maxScore: 100,
          percentage: pct,
          letterGrade: letter,
          gradedById: adminUser.id,
        },
      });
    }
  }
  console.log(`✅ Sample grades created for first 20 students`);

  // ─── 11. AI Knowledge Base ──────────────────────────────────
  const kbEntries = [
    {
      title: 'Fee Payment Policy',
      content: 'Monthly fees are due on the 10th of each month. Late fees of PKR 500 are charged after the 15th. Fees can be paid via the parent portal using credit/debit card, bank transfer, or EasyPaisa.',
      category: 'fees',
    },
    {
      title: 'Academic Calendar 2025-2026',
      content: 'Term 1: April 1 – July 31, 2025. Term 2: August 1 – November 30, 2025. Term 3: December 1 – March 31, 2026. School holidays include Eid ul Fitr (3 days), Eid ul Adha (3 days), Independence Day (August 14), and mid-term breaks.',
      category: 'calendar',
    },
    {
      title: 'Attendance Policy',
      content: 'Students must maintain at least 75% attendance to appear in final examinations. Parents are notified via SMS and WhatsApp within 15 minutes of their child being marked absent. Three consecutive unexcused absences trigger a mandatory parent meeting.',
      category: 'attendance',
    },
    {
      title: 'Examination Schedule',
      content: 'Mid-term exams are held in week 6 of each term. Final exams are in the last 2 weeks of each term. Students are notified 2 weeks in advance via the parent portal and announcement board.',
      category: 'exams',
    },
    {
      title: 'Admission Process',
      content: 'Admissions are open from January to March for the next academic year. Required documents: birth certificate, 2 passport photos, previous year report card, CNIC copy of parent/guardian. Admission fee of PKR 10,000 is non-refundable.',
      category: 'admissions',
    },
    {
      title: 'School Timings',
      content: 'School hours: Monday to Friday, 8:00 AM to 2:30 PM. Morning assembly starts at 7:50 AM. Gate closes at 8:15 AM. Late arrivals must report to the front office. Early dismissal requires written request from parent.',
      category: 'general',
    },
    {
      title: 'Contact Information',
      content: 'School office: +92-21-XXXXXXXX. Principal: principal@demo.bizvincdemo.com. Fee department: fees@demo.bizvincdemo.com. Office hours: Monday–Friday, 8:00 AM to 4:00 PM.',
      category: 'contact',
    },
    {
      title: 'Sibling Discount Policy',
      content: 'Families with 2 or more children enrolled simultaneously receive a 10% discount on the second child\'s tuition fee and a 15% discount on the third child\'s tuition fee. Discounts are applied automatically.',
      category: 'fees',
    },
  ];

  await prisma.aIKnowledgeBase.createMany({
    data: kbEntries.map((e) => ({ tenantId: tenant.id, ...e })),
    skipDuplicates: true,
  });
  console.log(`✅ ${kbEntries.length} AI knowledge base entries`);

  // ─── 12. Announcements ──────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      {
        tenantId: tenant.id,
        authorId: adminUser.id,
        title: 'Welcome Back to Term 1, 2025-2026!',
        content: 'We are delighted to welcome all students and parents to the new academic year. Classes begin April 1st. Please ensure all fees are paid by April 10th to avoid late charges.',
        priority: 'HIGH',
        isPublished: true,
        targetRoles: [],
      },
      {
        tenantId: tenant.id,
        authorId: adminUser.id,
        title: 'Parent-Teacher Meeting — April 20th',
        content: 'A Parent-Teacher meeting is scheduled for April 20th, 2025 from 9:00 AM to 1:00 PM. All parents are encouraged to meet their child\'s class teacher. Slot booking opens April 15th on the parent portal.',
        priority: 'NORMAL',
        isPublished: true,
        targetRoles: [],
      },
    ],
    skipDuplicates: false,
  });
  console.log(`✅ 2 announcements created`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@demo.bizvincdemo.com  /  Demo@12345');
  console.log('  Teacher: aisha.khan@demo.bizvincdemo.com  /  Teacher@12345');
  console.log('  Parent:  parent.2025-0001@demo.bizvincdemo.com  /  Parent@12345');
  console.log('  Student: student.2025-0001@demo.bizvincdemo.com  /  Student@12345\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
