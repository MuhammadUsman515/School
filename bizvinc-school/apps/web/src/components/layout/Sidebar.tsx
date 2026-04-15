'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Home, Users, ClipboardCheck, BookOpen, DollarSign,
  GraduationCap, MessageSquare, UserPlus, Calendar, Brain,
  ClipboardList, LogOut, Briefcase, School, FileText, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',             label: 'Dashboard',    icon: Home,          roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
  { href: '/students',     label: 'Students',     icon: Users,         roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { href: '/staff',        label: 'Staff',        icon: Briefcase,     roles: ['SCHOOL_ADMIN', 'PRINCIPAL'] },
  { href: '/classes',      label: 'Classes',      icon: School,        roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { href: '/attendance',   label: 'Attendance',   icon: ClipboardCheck, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { href: '/grades',       label: 'Gradebook',    icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
  { href: '/exams',        label: 'Exams',        icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'] },
  { href: '/assignments',  label: 'Assignments',  icon: FileText,      roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'] },
  { href: '/fees',         label: 'Fees',         icon: DollarSign,    roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'FINANCE_OFFICER', 'PARENT'] },
  { href: '/lms',          label: 'Courses',      icon: BookOpen,      roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
  { href: '/timetable',    label: 'Timetable',    icon: Calendar,      roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
  { href: '/communication',label: 'Communication',icon: MessageSquare, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'] },
  { href: '/admissions',   label: 'Admissions',   icon: UserPlus,      roles: ['SCHOOL_ADMIN', 'PRINCIPAL'] },
  { href: '/ai',           label: 'AI Analytics', icon: Brain,         roles: ['SCHOOL_ADMIN', 'PRINCIPAL'] },
  { href: '/settings',     label: 'Settings',     icon: Settings,      roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !user?.role || item.roles.includes(user.role),
  );

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="School logo" className="w-8 h-8 rounded-lg" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {tenant?.name?.[0] ?? 'B'}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{tenant?.name ?? 'Bizvinc School'}</p>
            <p className="text-xs text-gray-400 capitalize">{tenant?.plan?.toLowerCase() ?? 'free'} plan</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
