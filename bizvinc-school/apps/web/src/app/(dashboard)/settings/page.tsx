'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { School, User, Bell, Shield, Palette, Check } from 'lucide-react';

type Tab = 'school' | 'profile' | 'notifications' | 'security';

interface Tenant {
  id: string;
  name: string;
  primaryColor?: string;
  logoUrl?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  plan: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('school');
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: tenant } = useQuery<Tenant>({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get('/tenants/me').then((r) => r.data),
  });

  const [schoolForm, setSchoolForm] = useState({
    name: '', country: '', currency: '', timezone: '', primaryColor: '#7D35CA',
  });

  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    if (tenant) {
      setSchoolForm({
        name: tenant.name ?? '',
        country: tenant.country ?? '',
        currency: tenant.currency ?? '',
        timezone: tenant.timezone ?? '',
        primaryColor: tenant.primaryColor ?? '#7D35CA',
      });
    }
  }, [tenant]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: '',
      });
    }
  }, [user]);

  const updateSchool = useMutation({
    mutationFn: (data: typeof schoolForm) => api.patch('/tenants/me', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-settings'] }); flashSaved(); },
  });

  const updateProfile = useMutation({
    mutationFn: (data: typeof profileForm) => api.patch('/users/me', data).then((r) => r.data),
    onSuccess: () => { flashSaved(); },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data).then((r) => r.data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      flashSaved();
    },
  });

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const timezones = [
    'UTC', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Dhaka',
    'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Africa/Cairo',
  ];

  const currencies = ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'BDT', 'EGP', 'SAR'];
  const countries = ['Pakistan', 'India', 'UAE', 'USA', 'UK', 'Bangladesh', 'Egypt', 'Saudi Arabia', 'Other'];

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'school', label: 'School Settings', icon: School },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
            <Check className="w-4 h-4" /> Saved!
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'school' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <School className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">School Information</h3>
                  <p className="text-xs text-gray-500">Manage your school's basic information</p>
                </div>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); updateSchool.mutate(schoolForm); }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">School Name</label>
                  <input value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <select value={schoolForm.country} onChange={(e) => setSchoolForm({ ...schoolForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">Select country...</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                    <select value={schoolForm.currency} onChange={(e) => setSchoolForm({ ...schoolForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">Select currency...</option>
                      {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={schoolForm.timezone} onChange={(e) => setSchoolForm({ ...schoolForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select timezone...</option>
                    {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={schoolForm.primaryColor}
                      onChange={(e) => setSchoolForm({ ...schoolForm, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-1" />
                    <input value={schoolForm.primaryColor} onChange={(e) => setSchoolForm({ ...schoolForm, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="pt-2">
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Plan: <span className="font-medium text-purple-600 capitalize">{tenant?.plan?.toLowerCase() ?? 'free'}</span></p>
                  </div>
                  <button type="submit" disabled={updateSchool.isPending}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                    {updateSchool.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(profileForm); }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input value={user?.email ?? ''} disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+92 300 0000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={updateProfile.isPending}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                    {updateProfile.isPending ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'New student enrolled', desc: 'When a new student is admitted to your school' },
                  { label: 'Fee payment received', desc: 'When a fee payment is recorded' },
                  { label: 'Exam results published', desc: 'When exam grades are entered' },
                  { label: 'Low attendance alert', desc: 'When a student attendance drops below 75%' },
                  { label: 'Assignment submissions', desc: 'When students submit assignments' },
                  { label: 'New announcements', desc: 'When a new announcement is posted' },
                ].map(({ label, desc }) => (
                  <label key={label} className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 peer-checked:bg-purple-600 rounded-full transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="pt-6">
                <button onClick={flashSaved} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Change Password</h3>
                  <p className="text-xs text-gray-500">Use a strong password to keep your account safe</p>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
                  changePassword.mutate({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                  });
                }}
                className="space-y-4 max-w-md"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" required value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" required minLength={8} value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" required value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-300' : 'border-gray-300'
                    }`} />
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="pt-2">
                  <button type="submit"
                    disabled={changePassword.isPending || (!!passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
                    {changePassword.isPending ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
                {changePassword.isError && (
                  <p className="text-xs text-red-500">Failed to change password. Check your current password.</p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
