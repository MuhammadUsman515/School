'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Plus, Megaphone } from 'lucide-react';

export default function CommunicationPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'NORMAL' });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get(`/announcements?role=${user?.role}`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/announcements', { ...data, isPublished: true }),
    onSuccess: () => {
      toast.success('Announcement published!');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setShowForm(false);
      setForm({ title: '', content: '', priority: 'NORMAL' });
    },
    onError: () => toast.error('Failed to publish'),
  });

  const PRIORITY_COLORS: Record<string, string> = {
    EMERGENCY: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
        {['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(user?.role ?? '') && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Create Announcement</h3>
          <div className="space-y-4">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex items-center gap-4">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.title || !form.content || createMutation.isPending}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No announcements yet</p>
          </div>
        )}
        {announcements?.map((a: { id: string; title: string; content: string; priority: string; createdAt: string }) => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 ${PRIORITY_COLORS[a.priority]?.split(' ').slice(2).join(' ') ?? ''}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{a.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_COLORS[a.priority]}`}>
                {a.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{a.content}</p>
            <p className="text-xs text-gray-400 mt-3">{new Date(a.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
