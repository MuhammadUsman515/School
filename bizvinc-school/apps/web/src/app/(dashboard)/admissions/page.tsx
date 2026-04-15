'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { UserPlus, ChevronRight } from 'lucide-react';

type AdmissionStatus =
  | 'INQUIRY' | 'APPLIED' | 'DOCUMENTS_PENDING' | 'SHORTLISTED'
  | 'ACCEPTED' | 'ENROLLED' | 'REJECTED' | 'WAITLISTED' | 'WITHDRAWN';

const PIPELINE: AdmissionStatus[] = [
  'INQUIRY', 'APPLIED', 'DOCUMENTS_PENDING', 'SHORTLISTED',
  'ACCEPTED', 'ENROLLED',
];

const STATUS_COLORS: Record<string, string> = {
  INQUIRY: 'bg-gray-100 text-gray-700',
  APPLIED: 'bg-blue-100 text-blue-700',
  DOCUMENTS_PENDING: 'bg-yellow-100 text-yellow-700',
  SHORTLISTED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  ENROLLED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
  WAITLISTED: 'bg-orange-100 text-orange-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

const STATUS_LABEL: Record<string, string> = {
  INQUIRY: 'Inquiry',
  APPLIED: 'Applied',
  DOCUMENTS_PENDING: 'Docs Pending',
  SHORTLISTED: 'Shortlisted',
  ACCEPTED: 'Accepted',
  ENROLLED: 'Enrolled',
  REJECTED: 'Rejected',
  WAITLISTED: 'Waitlisted',
  WITHDRAWN: 'Withdrawn',
};

export default function AdmissionsPage() {
  const [activeStage, setActiveStage] = useState<AdmissionStatus>('INQUIRY');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', activeStage],
    queryFn: () => api.get(`/admissions?status=${activeStage}&limit=50`).then(r => r.data.data),
  });

  const { data: counts } = useQuery({
    queryKey: ['admission-counts'],
    queryFn: () => api.get('/admissions/counts').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admissions/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admission-counts'] });
      setSelectedId(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const admissions = data?.data ?? [];

  const NEXT_STATUS: Partial<Record<AdmissionStatus, AdmissionStatus>> = {
    INQUIRY: 'APPLIED',
    APPLIED: 'DOCUMENTS_PENDING',
    DOCUMENTS_PENDING: 'SHORTLISTED',
    SHORTLISTED: 'ACCEPTED',
    ACCEPTED: 'ENROLLED',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admissions Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Track applicants through each stage</p>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {PIPELINE.map((stage, idx) => {
          const count = counts?.[stage] ?? 0;
          const isActive = activeStage === stage;
          return (
            <div key={stage} className="flex items-center gap-1">
              <button
                onClick={() => setActiveStage(stage)}
                className={`flex flex-col items-center px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <span className={`text-xs font-medium ${isActive ? 'text-purple-700' : 'text-gray-600'}`}>
                  {STATUS_LABEL[stage]}
                </span>
                <span className={`text-xl font-bold mt-1 ${isActive ? 'text-purple-700' : 'text-gray-800'}`}>
                  {count}
                </span>
              </button>
              {idx < PIPELINE.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
            </div>
          );
        })}

        {/* Rejected / Waitlisted summary */}
        <div className="ml-4 flex gap-2">
          {['REJECTED', 'WAITLISTED'].map(s => (
            <button
              key={s}
              onClick={() => setActiveStage(s as AdmissionStatus)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                activeStage === s
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABEL[s]} ({counts?.[s] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Admission cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : admissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No applications in {STATUS_LABEL[activeStage]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admissions.map((adm: {
            id: string;
            applicantName: string;
            applicantEmail?: string;
            applicantPhone?: string;
            appliedGrade?: string;
            status: string;
            appliedAt: string;
            academicYear?: { name: string };
          }) => (
            <div
              key={adm.id}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedId === adm.id ? 'border-purple-500 shadow-md' : 'border-gray-200'
              }`}
              onClick={() => setSelectedId(selectedId === adm.id ? null : adm.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{adm.applicantName}</p>
                  {adm.appliedGrade && (
                    <p className="text-xs text-gray-500 mt-0.5">Applying for: Grade {adm.appliedGrade}</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[adm.status]}`}>
                  {STATUS_LABEL[adm.status]}
                </span>
              </div>

              {adm.applicantEmail && (
                <p className="text-xs text-gray-500 truncate">{adm.applicantEmail}</p>
              )}
              {adm.applicantPhone && (
                <p className="text-xs text-gray-500">{adm.applicantPhone}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">Applied: {formatDate(adm.appliedAt)}</p>

              {/* Actions */}
              {selectedId === adm.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
                  {NEXT_STATUS[adm.status as AdmissionStatus] && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        advanceMutation.mutate({ id: adm.id, status: NEXT_STATUS[adm.status as AdmissionStatus]! });
                      }}
                      disabled={advanceMutation.isPending}
                      className="flex-1 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      Move to {STATUS_LABEL[NEXT_STATUS[adm.status as AdmissionStatus]!]}
                    </button>
                  )}
                  {adm.status !== 'REJECTED' && adm.status !== 'ENROLLED' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        advanceMutation.mutate({ id: adm.id, status: 'REJECTED' });
                      }}
                      disabled={advanceMutation.isPending}
                      className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  {adm.status !== 'WAITLISTED' && adm.status !== 'ENROLLED' && adm.status !== 'REJECTED' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        advanceMutation.mutate({ id: adm.id, status: 'WAITLISTED' });
                      }}
                      disabled={advanceMutation.isPending}
                      className="px-3 py-1.5 border border-orange-300 text-orange-600 text-xs font-medium rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      Waitlist
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
