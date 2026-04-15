'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | 'LATE';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  PRESENT: { label: 'Present', color: 'bg-green-500', icon: CheckCircle },
  ABSENT_UNEXCUSED: { label: 'Absent', color: 'bg-red-500', icon: XCircle },
  ABSENT_EXCUSED: { label: 'Excused', color: 'bg-yellow-500', icon: XCircle },
  LATE: { label: 'Late', color: 'bg-orange-500', icon: Clock },
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((r) => r.data),
  });

  const { data: classData, isLoading } = useQuery<{ student: { id: string; firstName: string; lastName: string; admissionNumber: string } }[]>({
    queryKey: ['class-students', selectedClass],
    queryFn: () => api.get(`/classes/${selectedClass}/students`).then((r) => r.data),
    enabled: !!selectedClass,
  });

  useEffect(() => {
    if (classData) {
      const initial: Record<string, AttendanceStatus> = {};
      classData.forEach((s) => { initial[s.student.id] = 'PRESENT'; });
      setRecords(initial);
    }
  }, [classData]);

  const mutation = useMutation({
    mutationFn: (payload: unknown) => api.post('/attendance', payload),
    onSuccess: (data) => {
      toast.success(`Attendance marked! ${(data.data as { marked: number }).marked} students recorded.`);
      queryClient.invalidateQueries({ queryKey: ['attendance-alerts'] });
    },
    onError: () => toast.error('Failed to mark attendance'),
  });

  const toggleStatus = (studentId: string) => {
    const statuses: AttendanceStatus[] = ['PRESENT', 'ABSENT_UNEXCUSED', 'LATE', 'ABSENT_EXCUSED'];
    const current = records[studentId] || 'PRESENT';
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    setRecords((prev) => ({ ...prev, [studentId]: next }));
  };

  const markAllPresent = () => {
    const all: Record<string, AttendanceStatus> = {};
    classData?.forEach((s: { student: { id: string } }) => { all[s.student.id] = 'PRESENT'; });
    setRecords(all);
  };

  const submitAttendance = () => {
    if (!selectedClass) return toast.error('Select a class first');
    mutation.mutate({
      classId: selectedClass,
      date,
      records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
        <p className="text-sm text-gray-500">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="flex gap-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select a class...</option>
          {classes?.map((c: { id: string; grade: string; section: string; name: string }) => (
            <option key={c.id} value={c.id}>{c.name} ({c.grade}-{c.section})</option>
          ))}
        </select>
        <button
          onClick={markAllPresent}
          className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          All Present
        </button>
      </div>

      {selectedClass && (
        <div className="bg-white rounded-xl border border-gray-200">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading students...</div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {classData?.map((sc: { student: { id: string; firstName: string; lastName: string; admissionNumber: string } }) => {
                  const s = sc.student;
                  const status: AttendanceStatus = records[s.id] || 'PRESENT';
                  const config = STATUS_CONFIG[status];
                  return (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400">{s.admissionNumber}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStatus(s.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-colors ${config.color}`}
                      >
                        <config.icon className="w-3 h-3" />
                        {config.label}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {Object.values(records).filter((s) => s === 'PRESENT').length} present ·{' '}
                  {Object.values(records).filter((s) => s !== 'PRESENT').length} absent
                </p>
                <button
                  onClick={submitAttendance}
                  disabled={mutation.isPending}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
