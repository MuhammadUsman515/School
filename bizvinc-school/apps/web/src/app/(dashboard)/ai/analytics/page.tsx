'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { getRiskColor } from '@/lib/utils';
import { Brain, AlertTriangle, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7f1d1d',
};

export default function AIAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'defaulters' | 'weakareas' | 'anomalies'>('defaulters');
  const [selectedStudent, setSelectedStudent] = useState('');

  // Fee defaulter risks
  const { data: risksData, isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ['ai-risks'],
    queryFn: () => api.get('/ai/defaulter-risks?limit=100').then(r => r.data.data),
  });

  // Weak areas for selected student
  const { data: weakAreas, isLoading: weakLoading } = useQuery({
    queryKey: ['weak-areas', selectedStudent],
    queryFn: () => api.get(`/ai/weak-areas/${selectedStudent}`).then(r => r.data.data),
    enabled: !!selectedStudent,
  });

  // Students list for selector
  const { data: studentsData } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => api.get('/students?limit=100').then(r => r.data.data),
  });

  // Run predictions mutation
  const runMutation = useMutation({
    mutationFn: () => api.post('/ai/run-predictions'),
    onSuccess: () => {
      toast.success('AI predictions refreshed!');
      refetchRisks();
    },
    onError: () => toast.error('Failed to run predictions'),
  });

  const risks = risksData?.data ?? [];
  const students = studentsData?.data ?? [];

  // Build pie chart data
  const riskPieData = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(cat => ({
    name: cat,
    value: risks.filter((r: { riskCategory: string }) => r.riskCategory === cat).length,
  })).filter(d => d.value > 0);

  // Top 10 at-risk for bar chart
  const barData = [...risks]
    .sort((a: { riskScore: number }, b: { riskScore: number }) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map((r: {
      student?: { firstName: string; lastName: string; admissionNumber: string };
      riskScore: number;
      riskCategory: string;
    }) => ({
      name: r.student ? `${r.student.firstName} ${r.student.lastName[0]}.` : '?',
      score: Math.round(r.riskScore),
      category: r.riskCategory,
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Machine-learning insights for proactive school management</p>
        </div>
        <button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {runMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Run AI Predictions
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'defaulters', label: 'Fee Defaulter Risk', icon: AlertTriangle },
          { key: 'weakareas', label: 'Weak Areas', icon: TrendingDown },
          { key: 'anomalies', label: 'Absence Anomalies', icon: Brain },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Fee Defaulter Risk tab */}
      {activeTab === 'defaulters' && (
        <div className="space-y-6">
          {risksLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(cat => {
                  const count = risks.filter((r: { riskCategory: string }) => r.riskCategory === cat).length;
                  return (
                    <div key={cat} className={`rounded-xl p-4 border ${getRiskColor(cat)}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{cat} Risk</p>
                      <p className="text-3xl font-bold mt-1">{count}</p>
                      <p className="text-xs opacity-70 mt-1">students</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                {riskPieData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Risk Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={riskPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {riskPieData.map((entry) => (
                            <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Bar chart — top 10 */}
                {barData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top 10 At-Risk Students</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barData} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Risk Score']} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {barData.map((entry) => (
                            <Cell key={entry.name} fill={RISK_COLORS[entry.category] || '#7D35CA'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Full risk table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">All Risk Assessments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500 border-b bg-gray-50">
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Admission No.</th>
                        <th className="px-6 py-3 font-medium">Risk Score</th>
                        <th className="px-6 py-3 font-medium">Category</th>
                        <th className="px-6 py-3 font-medium">Predicted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {risks.slice(0, 30).map((r: {
                        studentId: string;
                        riskScore: number;
                        riskCategory: string;
                        predictedAt: string;
                        student?: { firstName: string; lastName: string; admissionNumber: string };
                      }) => (
                        <tr key={r.studentId} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-900">
                            {r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentId}
                          </td>
                          <td className="px-6 py-3 text-gray-500">{r.student?.admissionNumber}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${r.riskScore}%`,
                                    backgroundColor: RISK_COLORS[r.riskCategory],
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium">{Math.round(r.riskScore)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(r.riskCategory)}`}>
                              {r.riskCategory}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-400 text-xs">
                            {new Date(r.predictedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Weak Areas tab */}
      {activeTab === 'weakareas' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Student:</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Choose a student...</option>
              {students.map((s: { id: string; firstName: string; lastName: string; admissionNumber: string }) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          {!selectedStudent ? (
            <div className="text-center py-16 text-gray-400">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Select a student to view weak areas</p>
            </div>
          ) : weakLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : !weakAreas?.data?.length ? (
            <div className="text-center py-16 text-gray-400">
              <p>No weak areas identified for this student</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weakAreas.data.map((wa: {
                id: string;
                topic: string;
                masteryScore: number;
                subject?: { name: string; color: string };
                detectedAt: string;
              }) => (
                <div key={wa.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{wa.topic}</p>
                      {wa.subject && (
                        <span
                          className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: wa.subject.color || '#7D35CA' }}
                        >
                          {wa.subject.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Mastery</span>
                      <span>{Math.round(wa.masteryScore * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          wa.masteryScore >= 0.7 ? 'bg-green-500' :
                          wa.masteryScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${wa.masteryScore * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Detected: {new Date(wa.detectedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Absence Anomalies tab */}
      {activeTab === 'anomalies' && (
        <AnomaliesTab students={students} />
      )}
    </div>
  );
}

function AnomaliesTab({ students }: { students: { id: string; firstName: string; lastName: string; admissionNumber: string }[] }) {
  const [studentId, setStudentId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['absence-anomalies', studentId],
    queryFn: () =>
      api.post('/ai/absence-anomalies', { studentId: studentId || undefined }).then(r => r.data.data),
    enabled: true,
  });

  const anomalies = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by student:</label>
        <select
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All students</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : anomalies.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No anomalies detected</p>
          <p className="text-sm">All attendance patterns look normal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a: {
            studentId: string;
            studentName: string;
            type: string;
            description: string;
            severity: string;
            detectedAt: string;
          }, idx: number) => (
            <div key={idx} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
              a.severity === 'HIGH' ? 'border-red-300' :
              a.severity === 'MEDIUM' ? 'border-yellow-300' : 'border-gray-200'
            }`}>
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                a.severity === 'HIGH' ? 'bg-red-100' :
                a.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <Brain className={`w-5 h-5 ${
                  a.severity === 'HIGH' ? 'text-red-600' :
                  a.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-gray-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{a.studentName}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    a.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {a.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                <p className="text-xs text-gray-400 mt-1">Type: {a.type} · {new Date(a.detectedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
