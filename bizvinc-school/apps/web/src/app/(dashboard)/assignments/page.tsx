'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, X, FileText, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  status: string;
  course?: { title: string };
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  student: { firstName: string; lastName: string; admissionNumber: string };
  submittedAt: string;
  marks?: number;
  status: string;
}

export default function AssignmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', totalMarks: '100', courseId: '',
  });

  const qc = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => api.get('/assignments').then((r) => r.data),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((r) => r.data),
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions', expandedId],
    queryFn: () => api.get(`/assignments/${expandedId}/submissions`).then((r) => r.data),
    enabled: !!expandedId,
  });

  const createAssignment = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/assignments', { ...data, totalMarks: Number(data.totalMarks) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      setShowModal(false);
      setForm({ title: '', description: '', dueDate: '', totalMarks: '100', courseId: '' });
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    CLOSED: 'bg-red-100 text-red-700',
    GRADED: 'bg-blue-100 text-blue-700',
  };

  const getDueStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Overdue', cls: 'text-red-600' };
    if (diffDays === 0) return { label: 'Due today', cls: 'text-orange-600' };
    if (diffDays <= 3) return { label: `Due in ${diffDays}d`, cls: 'text-orange-500' };
    return { label: `Due ${due.toLocaleDateString()}`, cls: 'text-gray-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-sm text-gray-500 mt-1">{assignments?.length ?? 0} assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading assignments...</div>
      ) : (
        <div className="space-y-3">
          {assignments?.map((a: Assignment) => {
            const dueStatus = getDueStatus(a.dueDate);
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {a.course && <span className="text-xs text-gray-500">{a.course.title}</span>}
                        <span className={`text-xs ${dueStatus.cls} flex items-center gap-1`}>
                          <Calendar className="w-3 h-3" /> {dueStatus.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {a.totalMarks} marks
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                    <span className="text-xs text-gray-400">{a._count?.submissions ?? 0} submissions</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    {a.description && (
                      <p className="text-sm text-gray-600 mb-4">{a.description}</p>
                    )}
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Submissions</h4>
                    {!submissions ? (
                      <p className="text-sm text-gray-400">Loading submissions...</p>
                    ) : submissions.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No submissions yet</p>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Submitted</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Marks</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {submissions.map((sub: Submission) => (
                              <tr key={sub.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-medium text-gray-900">
                                  {sub.student.firstName} {sub.student.lastName}
                                  <span className="text-xs text-gray-400 ml-1">({sub.student.admissionNumber})</span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-2.5 text-gray-900">
                                  {sub.marks != null ? `${sub.marks}/${a.totalMarks}` : '—'}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    sub.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                                    sub.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>{sub.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {assignments?.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No assignments yet. Create your first assignment.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">New Assignment</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); createAssignment.mutate(form); }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Assignment title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Assignment instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
                <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select course...</option>
                  {courses?.map((c: { id: string; title: string }) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
                  <input required type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Marks</label>
                  <input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={createAssignment.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                  {createAssignment.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
