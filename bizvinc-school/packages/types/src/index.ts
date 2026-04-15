// ─────────────────────────────────────────────────────────
// Shared TypeScript types for Bizvinc School
// Used by both apps/web and apps/api
// ─────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'PRINCIPAL'
  | 'TEACHER' | 'FINANCE_OFFICER' | 'STUDENT'
  | 'PARENT' | 'LIBRARIAN' | 'TRANSPORT_MANAGER';

export type Plan = 'FREE' | 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'SUSPENDED';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
export type Relationship = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'SIBLING' | 'OTHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | 'LATE' | 'HALF_DAY' | 'MEDICAL_LEAVE' | 'HOLIDAY';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
export type PaymentGateway = 'STRIPE' | 'RAZORPAY' | 'FLUTTERWAVE' | 'PAYTABS' | 'MANUAL';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type FeeFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'ONE_TIME';
export type FeeType = 'TUITION' | 'REGISTRATION' | 'ACTIVITY' | 'LAB' | 'TRANSPORT' | 'HOSTEL' | 'EXAM' | 'LIBRARY' | 'UNIFORM' | 'OTHER';
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK' | 'MATCHING';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type NotificationType = 'ATTENDANCE_ABSENT' | 'GRADE_POSTED' | 'ASSIGNMENT_DUE' | 'EXAM_SCHEDULED' | 'FEE_DUE' | 'FEE_OVERDUE' | 'PAYMENT_RECEIVED' | 'ANNOUNCEMENT' | 'MESSAGE' | 'EMERGENCY' | 'AI_ALERT';
export type AdmissionStatus = 'INQUIRY' | 'APPLIED' | 'DOCUMENTS_PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'ENROLLED' | 'REJECTED' | 'WAITLISTED' | 'WITHDRAWN';
export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── Auth ──────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  primaryColor: string;
  logoUrl?: string;
}

// ─── API Response Wrappers ─────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Student ───────────────────────────────────────────────

export interface Student {
  id: string;
  tenantId: string;
  userId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  nationality?: string;
  bloodGroup?: string;
  photoUrl?: string;
  status: StudentStatus;
  enrolledAt: string;
  createdAt: string;
  user?: { email: string; phone?: string; avatarUrl?: string };
  feeDefaulterRisk?: { riskCategory: RiskCategory; riskScore: number };
}

// ─── Attendance ────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  period?: number;
  status: AttendanceStatus;
  notes?: string;
}

// ─── Grade ─────────────────────────────────────────────────

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  termId: string;
  score: number;
  maxScore: number;
  percentage?: number;
  letterGrade?: string;
  comments?: string;
  gradedAt: string;
  subject?: { name: string; color: string };
}

// ─── Invoice ───────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedAt: string;
  paidAt?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
}

// ─── Notification ──────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// ─── AI ────────────────────────────────────────────────────

export interface FeeDefaulterRisk {
  studentId: string;
  riskScore: number;
  riskCategory: RiskCategory;
  predictedAt: string;
  student?: Pick<Student, 'firstName' | 'lastName' | 'admissionNumber'>;
}

export interface GeneratedQuestion {
  question: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
}
