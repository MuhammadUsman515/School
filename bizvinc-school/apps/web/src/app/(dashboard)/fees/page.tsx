'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';

export default function FeesPage() {
  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get('/invoices/summary').then((r) => r.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices?limit=20').then((r) => r.data),
  });

  const { data: defaulters } = useQuery({
    queryKey: ['defaulters'],
    queryFn: () => api.get('/invoices/defaulters').then((r) => r.data),
  });

  const STATUS_COLORS: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-orange-100 text-orange-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.collected ?? 0)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.outstanding ?? 0)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.overdue ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Defaulter Aging Buckets */}
      {defaulters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Overdue Invoices by Age</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['0-30', '31-60', '60+'].map((bucket) => (
              <div key={bucket} className={`rounded-lg p-4 ${bucket === '60+' ? 'bg-red-50' : bucket === '31-60' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                <p className="text-sm font-medium text-gray-700">{bucket} days</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{defaulters[bucket]?.length ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">invoices overdue</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Invoice #', 'Student', 'Amount', 'Due Date', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices?.data?.map((inv: {
              id: string; invoiceNumber: string;
              student: { firstName: string; lastName: string };
              totalAmount: number; dueDate: string; status: string;
            }) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{inv.student.firstName} {inv.student.lastName}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-purple-600 hover:text-purple-800 cursor-pointer">View</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
