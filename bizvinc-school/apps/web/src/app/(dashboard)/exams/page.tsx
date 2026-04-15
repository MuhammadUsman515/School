'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ClipboardList, Calendar, Clock, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-600',
  ONGOING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function ExamsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['exams', statusFilter],
    queryFn: () => api.get(`/exams?status=${statusFilter}&limit=30`).then(r => r.data.data),
  });

  const { data: examDetail } = useQuery({
    queryKey: ['exam-detail', selectedExam],
    queryFn: () => api.get(`/exams/${selectedExam}`).then(r => r.data.data),
    enabled: !!selectedExam,
  });

  const exams = data?.data ?? [];

  const statuses = ['', 'DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and schedule examinations</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === s
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Exam list */}
        <div className="w-2/5 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No exams found</p>
            </div>
          ) : (
            exams.map((exam: {
              id: string;
              title: string;
              status: string;
              scheduledAt?: string;
              durationMinutes?: number;
              totalMarks?: number;
              class?: { name: string };
              subject?: { name: string; color: string };
            }) => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedExam === exam.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-900 text-sm">{exam.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[exam.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {exam.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {exam.class && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {exam.class.name}
                    </span>
                  )}
                  {exam.subject && (
                    <span
                      className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                      style={{ backgroundColor: exam.subject.color || '#7D35CA' }}
                    >
                      {exam.subject.name}
                    </span>
                  )}
                  {exam.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(exam.scheduledAt)}
                    </span>
                  )}
                  {exam.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exam.durationMinutes} min
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Exam detail */}
        <div className="flex-1">
          {!selectedExam || !examDetail ? (
            <div className="h-full min-h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              <div className="text-center">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Select an exam</p>
                <p className="text-sm">Click an exam to view questions and results</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{examDetail.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[examDetail.status] ?? ''}`}>
                    {examDetail.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  {examDetail.totalMarks && <span>Total Marks: <strong>{examDetail.totalMarks}</strong></span>}
                  {examDetail.passingMarks && <span>Passing: <strong>{examDetail.passingMarks}</strong></span>}
                  {examDetail.durationMinutes && <span>Duration: <strong>{examDetail.durationMinutes} min</strong></span>}
                  {examDetail.instructions && <p className="w-full text-sm text-gray-500 mt-1">{examDetail.instructions}</p>}
                </div>
              </div>

              {/* Questions */}
              {examDetail.questions && examDetail.questions.length > 0 ? (
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Questions ({examDetail.questions.length})</h3>
                  {examDetail.questions.map((q: {
                    id: string;
                    order: number;
                    marks: number;
                    questionBank?: {
                      question: string;
                      questionType: string;
                      difficulty: string;
                      options?: string[];
                      correctAnswer: string;
                    };
                  }, idx: number) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Q{idx + 1}.</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            q.questionBank?.difficulty === 'EASY' ? 'bg-green-100 text-green-600' :
                            q.questionBank?.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {q.questionBank?.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">{q.marks} marks</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900">{q.questionBank?.question}</p>
                      {q.questionBank?.options && (
                        <ul className="mt-2 space-y-1">
                          {q.questionBank.options.map((opt, oi) => (
                            <li key={oi} className={`text-xs px-3 py-1 rounded ${
                              opt === q.questionBank?.correctAnswer
                                ? 'bg-green-50 text-green-700 font-medium'
                                : 'text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + oi)}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <p>No questions added yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
