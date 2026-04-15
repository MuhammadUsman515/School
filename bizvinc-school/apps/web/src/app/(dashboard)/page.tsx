'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Users, ClipboardCheck, DollarSign, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ElementType;
  color: string; subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function AdminDashboard() {
  const { data: financial } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get('/invoices/summary').then((r) => r.data),
  });
  const { data: students } = useQuery({
    queryKey: ['students-count'],
    queryFn: () => api.get('/students?limit=1').then((r) => r.data),
  });
  const { data: alerts } = useQuery({
    queryKey: ['attendance-alerts'],
    queryFn: () => api.get('/attendance/alerts').then((r) => r.data),
  });
  const { data: risks } = useQuery({
    queryKey: ['defaulter-risks'],
    queryFn: () => api.get('/ai/defaulter-risks').then((r) => r.data),
  });

  const highRisk = risks?.filter((r: { riskCategory: string }) => ['HIGH', 'CRITICAL'].includes(r.riskCategory)) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">School Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students?.total ?? '—'} icon={Users} color="bg-blue-500" />
        <StatCard title="Fees Collected" value={formatCurrency(financial?.collected ?? 0)} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Outstanding" value={formatCurrency(financial?.outstanding ?? 0)} icon={TrendingUp} color="bg-orange-500" />
        <StatCard title="Attendance Alerts" value={alerts?.length ?? 0} icon={ClipboardCheck} color="bg-red-500" subtitle="Below 75%" />
      </div>

      {highRisk.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">AI Fee Defaulter Alerts</h3>
            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {highRisk.length} at risk
            </span>
          </div>
          <div className="space-y-3">
            {highRisk.slice(0, 5).map((r: { student: { firstName: string; lastName: string; admissionNumber: string }; riskCategory: string; riskScore: number }) => (
              <div key={r.student.admissionNumber} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.student.firstName} {r.student.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{r.student.admissionNumber}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  r.riskCategory === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {r.riskCategory} · {Math.round(r.riskScore * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherDashboard() {
  const { data: assignments } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/assignments?limit=5').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Pending Assignments" value={assignments?.length ?? 0} icon={BookOpen} color="bg-purple-500" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Recent Assignments</h3>
        {assignments?.map((a: { id: string; title: string; dueDate: string; _count?: { submissions: number } }) => (
          <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
            <p className="text-sm font-medium text-gray-900">{a.title}</p>
            <p className="text-xs text-gray-400">{new Date(a.dueDate).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { data: grades } = useQuery({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/grades?limit=5').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Recent Grades</h3>
        {grades?.map((g: { id: string; subject: { name: string }; percentage: number; letterGrade: string }) => (
          <div key={g.id} className="flex justify-between items-center py-2 border-b last:border-0">
            <p className="text-sm font-medium text-gray-900">{g.subject.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{g.percentage}%</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{g.letterGrade}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'TEACHER') return <TeacherDashboard />;
  if (user?.role === 'STUDENT') return <StudentDashboard />;
  return <AdminDashboard />;
}
