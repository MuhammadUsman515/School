'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getRiskColor } from '@/lib/utils';
import { Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, page],
    queryFn: () => api.get(`/students?search=${search}&page=${page}&limit=20`).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <Link
          href="/students/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or admission number..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Student', 'Admission No.', 'Class', 'Status', 'Risk', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
            )}
            {data?.data?.map((s: {
              id: string; firstName: string; lastName: string; admissionNumber: string;
              status: string; user: { avatarUrl?: string };
              classes: { class: { name: string; grade: string; section: string } }[];
              feeDefaulterRisk?: { riskCategory: string };
            }) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{s.admissionNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {s.classes[0]?.class ? `${s.classes[0].class.grade}-${s.classes[0].class.section}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.feeDefaulterRisk ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskColor(s.feeDefaulterRisk.riskCategory)}`}>
                      {s.feeDefaulterRisk.riskCategory}
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/students/${s.id}`} className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data?.total ?? 0} total students
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page} of {data?.totalPages ?? 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (data?.totalPages ?? 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
