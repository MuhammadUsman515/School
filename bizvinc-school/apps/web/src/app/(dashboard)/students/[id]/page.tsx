'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency, getRiskColor, getInitials } from '@/lib/utils';
import { ArrowLeft, Mail, Phone, BookOpen, CreditCard, Calendar, AlertTriangle } from 'lucide-react';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then(r => r.data.data),
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: () => api.get(`/students/${id}/attendance?limit=30`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: grades } = useQuery({
    queryKey: ['student-grades', id],
    queryFn: () => api.get(`/students/${id}/grades`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: invoices } = useQuery({
    queryKey: ['student-invoices', id],
    queryFn: () => api.get(`/students/${id}/invoices`).then(r => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!student) return <div className="p-6 text-gray-500">Student not found.</div>;

  const risk = student.feeDefaulterRisk;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-2xl font-bold flex-shrink-0">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              getInitials(student.firstName, student.lastName)
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
              <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Admission No.</p>
              <p className="font-semibold text-gray-900">{student.admissionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {student.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
              <p className="font-semibold text-gray-900">{formatDate(student.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
              <p className="font-semibold text-gray-900">{student.gender}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Enrolled</p>
              <p className="font-semibold text-gray-900">{formatDate(student.enrolledAt)}</p>
            </div>
            {student.user?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-700">{student.user.email}</p>
              </div>
            )}
            {student.user?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-700">{student.user.phone}</p>
              </div>
            )}
          </div>

          {risk && (
            <div className={`px-4 py-3 rounded-lg border ${getRiskColor(risk.riskCategory)} flex-shrink-0`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Fee Risk</span>
              </div>
              <p className="text-2xl font-bold">{risk.riskScore}%</p>
              <p className="text-xs">{risk.riskCategory}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Attendance (30d)</span>
          </div>
          {attendanceSummary?.summary ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {attendanceSummary.summary.attendanceRate?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {attendanceSummary.summary.present} present / {attendanceSummary.summary.total} days
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No data</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Academic Performance</span>
          </div>
          {grades?.reportCard ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {grades.reportCard.overallPercentage?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Overall GPA: {grades.reportCard.overallGPA}</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No grades yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Fee Status</span>
          </div>
          {invoices?.data?.length > 0 ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  invoices.data.reduce((acc: number, inv: { paidAmount: number }) => acc + inv.paidAmount, 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {invoices.data.filter((i: { status: string }) => i.status === 'OVERDUE').length} overdue invoice(s)
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No invoices</p>
          )}
        </div>
      </div>

      {/* Grades Table */}
      {grades?.reportCard?.subjects && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Card</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b">
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Percentage</th>
                <th className="pb-3 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.reportCard.subjects.map((subj: {
                subjectId: string;
                subjectName: string;
                weightedAverage: number;
                percentage: number;
                letterGrade: string;
              }) => (
                <tr key={subj.subjectId}>
                  <td className="py-3 font-medium text-gray-900">{subj.subjectName}</td>
                  <td className="py-3 text-gray-600">{subj.weightedAverage?.toFixed(1)}</td>
                  <td className="py-3 text-gray-600">{subj.percentage?.toFixed(1)}%</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      subj.letterGrade?.startsWith('A') ? 'bg-green-100 text-green-700' :
                      subj.letterGrade?.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                      subj.letterGrade?.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {subj.letterGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Invoices */}
      {invoices?.data?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Invoices</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b">
                <th className="pb-3 font-medium">Invoice #</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.data.slice(0, 6).map((inv: {
                id: string;
                invoiceNumber: string;
                totalAmount: number;
                dueDate: string;
                status: string;
              }) => (
                <tr key={inv.id}>
                  <td className="py-3 text-gray-700">{inv.invoiceNumber}</td>
                  <td className="py-3 font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-3 text-gray-600">{formatDate(inv.dueDate)}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                      inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
