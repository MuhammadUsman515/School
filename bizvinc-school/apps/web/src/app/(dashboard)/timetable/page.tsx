'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri',
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type TimetableSlot = {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject?: { name: string; color: string };
  teacher?: { firstName: string; lastName: string };
  room?: string;
};

export default function TimetablePage() {
  const [classId, setClassId] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes?limit=50').then(r => r.data.data),
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ['timetable', classId],
    queryFn: () => api.get(`/timetable?classId=${classId}`).then(r => r.data.data),
    enabled: !!classId,
  });

  const classesList = classes?.data ?? [];
  const slotsList: TimetableSlot[] = slots?.data ?? [];

  // Build grid: day → period → slot
  const grid: Record<string, Record<number, TimetableSlot>> = {};
  for (const day of DAYS) grid[day] = {};
  for (const slot of slotsList) {
    grid[slot.dayOfWeek][slot.periodNumber] = slot;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm text-gray-500 mt-1">Weekly class schedule</p>
        </div>
        <select
          value={classId}
          onChange={e => setClassId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select a class...</option>
          {classesList.map((cls: { id: string; name: string; section: string }) => (
            <option key={cls.id} value={cls.id}>{cls.name} – {cls.section}</option>
          ))}
        </select>
      </div>

      {!classId ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Select a class to view its timetable</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">
                  Period
                </th>
                {DAYS.map(day => (
                  <th
                    key={day}
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PERIODS.map(period => (
                <tr key={period} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
                    P{period}
                  </td>
                  {DAYS.map(day => {
                    const slot = grid[day]?.[period];
                    if (!slot) {
                      return (
                        <td key={day} className="px-2 py-2">
                          <div className="h-16 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-gray-300 text-xs">—</span>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="px-2 py-2">
                        <div
                          className="h-16 rounded-lg p-2 flex flex-col justify-between text-white"
                          style={{ backgroundColor: slot.subject?.color || '#7D35CA' }}
                        >
                          <p className="text-xs font-bold leading-tight truncate">
                            {slot.subject?.name ?? 'Unknown'}
                          </p>
                          <div>
                            {slot.teacher && (
                              <p className="text-xs opacity-90 truncate">
                                {slot.teacher.firstName} {slot.teacher.lastName[0]}.
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <p className="text-xs opacity-75">
                                {slot.startTime} – {slot.endTime}
                              </p>
                              {slot.room && (
                                <p className="text-xs opacity-75">{slot.room}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {slotsList.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No timetable configured for this class</p>
              <p className="text-sm mt-1">Timetable slots will appear here once scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {classId && slotsList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Array.from(new Set(slotsList.map(s => JSON.stringify({ name: s.subject?.name, color: s.subject?.color }))))
            .map(s => JSON.parse(s))
            .filter(s => s.name)
            .map((subj: { name: string; color: string }) => (
              <div key={subj.name} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: subj.color || '#7D35CA' }}
                />
                <span className="text-xs text-gray-600">{subj.name}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
