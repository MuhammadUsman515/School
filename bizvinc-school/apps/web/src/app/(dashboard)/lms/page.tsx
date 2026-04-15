'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookOpen, Play, Users, Clock, ChevronRight, Search } from 'lucide-react';

export default function LMSPage() {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search],
    queryFn: () => api.get(`/courses?search=${search}&limit=20`).then(r => r.data.data),
  });

  const { data: modules } = useQuery({
    queryKey: ['course-modules', selectedCourse],
    queryFn: () => api.get(`/courses/${selectedCourse}/modules`).then(r => r.data.data),
    enabled: !!selectedCourse,
  });

  const courses = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Management</h1>
          <p className="text-sm text-gray-500 mt-1">Courses, modules, and learning materials</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Course list */}
        <div className="w-1/3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No courses yet</p>
              <p className="text-sm">Courses will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-2">
              {courses.map((course: {
                id: string;
                title: string;
                description?: string;
                totalLessons?: number;
                enrolledCount?: number;
                subject?: { name: string; color: string };
              }) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedCourse === course.id
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                      {course.subject && (
                        <span
                          className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: course.subject.color || '#7D35CA' }}
                        >
                          {course.subject.name}
                        </span>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {course.totalLessons ?? 0} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.enrolledCount ?? 0} enrolled
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Course detail */}
        <div className="flex-1">
          {!selectedCourse ? (
            <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Select a course</p>
                <p className="text-sm">Click a course on the left to view its modules</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
                <h2 className="text-xl font-bold text-white">
                  {courses.find((c: { id: string }) => c.id === selectedCourse)?.title}
                </h2>
                <p className="text-purple-200 text-sm mt-1">
                  {courses.find((c: { id: string; description?: string }) => c.id === selectedCourse)?.description}
                </p>
              </div>

              <div className="p-6">
                {!modules?.data?.length ? (
                  <div className="text-center py-8 text-gray-400">
                    <Play className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>No modules in this course yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.data.map((mod: {
                      id: string;
                      title: string;
                      order: number;
                      lessons?: { id: string; title: string; durationMinutes?: number; completions?: { completedAt: string }[] }[];
                    }, idx: number) => (
                      <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">{mod.title}</h3>
                          <span className="ml-auto text-xs text-gray-500">
                            {mod.lessons?.length ?? 0} lessons
                          </span>
                        </div>
                        {mod.lessons && mod.lessons.length > 0 && (
                          <div className="divide-y divide-gray-100">
                            {mod.lessons.map((lesson, li) => (
                              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                                  lesson.completions?.length
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {lesson.completions?.length ? '✓' : li + 1}
                                </div>
                                <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                                {lesson.durationMinutes && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {lesson.durationMinutes}m
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
