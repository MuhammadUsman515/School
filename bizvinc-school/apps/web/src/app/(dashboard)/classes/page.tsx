'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Users, BookOpen, X, GraduationCap } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  _count?: { enrollments: number };
  teacher?: { user: { firstName: string; lastName: string } };
}

export default function ClassesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState({ name: '', grade: '', section: '', capacity: '30' });

  const qc = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((r) => r.data),
  });

  const { data: classStudents } = useQuery({
    queryKey: ['class-students', selectedClass?.id],
    queryFn: () => api.get(`/students?classId=${selectedClass!.id}`).then((r) => r.data),
    enabled: !!selectedClass,
  });

  const createClass = useMutation({
    mutationFn: (data: typeof form) => api.post('/classes', { ...data, capacity: Number(data.capacity) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      setShowModal(false);
      setForm({ name: '', grade: '', section: '', capacity: '30' });
    },
  });

  const grades = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
          <p className="text-sm text-gray-500 mt-1">{classes?.length ?? 0} classes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Class
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-1 space-y-3">
          {isLoading && <div className="text-center py-8 text-gray-400">Loading classes...</div>}
          {classes?.map((cls: ClassItem) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedClass?.id === cls.id
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Grade {cls.grade} — Section {cls.section}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls._count?.enrollments ?? 0}/{cls.capacity}</span>
                  </div>
                </div>
              </div>
              {cls.teacher && (
                <p className="text-xs text-purple-600 mt-2">
                  Teacher: {cls.teacher.user.firstName} {cls.teacher.user.lastName}
                </p>
              )}
            </button>
          ))}
          {classes?.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No classes yet</p>
            </div>
          )}
        </div>

        {/* Class Detail */}
        <div className="lg:col-span-2">
          {selectedClass ? (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{selectedClass.name}</h3>
                    <p className="text-sm text-gray-500">Grade {selectedClass.grade} · Section {selectedClass.section}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{classStudents?.length ?? 0} students enrolled</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Enrolled Students
                </h4>
                {classStudents?.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No students enrolled in this class</p>
                )}
                <div className="space-y-2">
                  {classStudents?.map((s: {
                    id: string; firstName: string; lastName: string;
                    admissionNumber: string; rollNumber?: string;
                  }) => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                      </div>
                      <div className="text-xs text-gray-400">{s.admissionNumber}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a class to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Create New Class</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); createClass.mutate(form); }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Class 5A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grade *</label>
                  <select required value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select...</option>
                    {grades.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Section *</label>
                  <input required value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" min="1" max="100" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={createClass.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {createClass.isPending ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
