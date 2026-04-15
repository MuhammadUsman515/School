'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GradesPage() {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((r) => r.data),
  });

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades', classId, subjectId],
    queryFn: () => api.get(`/grades?classId=${classId}&subjectId=${subjectId}`).then((r) => r.data),
    enabled: !!classId,
  });

  const GRADE_COLORS: Record<string, string> = {
    'A+': 'bg-green-100 text-green-800', A: 'bg-green-100 text-green-800',
    'A-': 'bg-green-100 text-green-800', 'B+': 'bg-blue-100 text-blue-800',
    B: 'bg-blue-100 text-blue-800', 'B-': 'bg-blue-100 text-blue-800',
    'C+': 'bg-yellow-100 text-yellow-800', C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800', F: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Gradebook</h2>

      <div className="flex gap-4">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select Class...</option>
          {classes?.map((c: { id: string; grade: string; section: string; name: string }) => (
            <option key={c.id} value={c.id}>{c.name} ({c.grade}-{c.section})</option>
          ))}
        </select>
      </div>

      {classId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Student', 'Subject', 'Score', 'Max', 'Percentage', 'Grade', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading grades...</td></tr>}
              {grades?.map((g: {
                id: string; student: { firstName: string; lastName: string };
                subject: { name: string }; score: number; maxScore: number;
                percentage: number; letterGrade: string; gradedAt: string;
              }) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{g.student.firstName} {g.student.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{g.subject.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{Number(g.score)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{Number(g.maxScore)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{Number(g.percentage)}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRADE_COLORS[g.letterGrade] ?? 'bg-gray-100 text-gray-600'}`}>
                      {g.letterGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(g.gradedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!isLoading && grades?.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No grades found for this class</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
