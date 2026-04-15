'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register: registerSchool } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<{
    schoolName: string; schoolSlug: string; email: string;
    password: string; firstName: string; lastName: string; country: string;
  }>();

  const onSubmit = async (data: Parameters<typeof registerSchool>[0]) => {
    setLoading(true);
    try {
      await registerSchool(data);
      toast.success('School registered! Welcome to Bizvinc School.');
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-700">Bizvinc School</h1>
          <p className="text-gray-500 mt-2">Register your school — free to start</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'schoolName', label: 'School Name', placeholder: 'Sunrise Academy' },
            { name: 'schoolSlug', label: 'School URL Slug', placeholder: 'sunrise-academy' },
            { name: 'firstName', label: 'Your First Name', placeholder: 'John' },
            { name: 'lastName', label: 'Your Last Name', placeholder: 'Doe' },
            { name: 'email', label: 'Admin Email', placeholder: 'admin@sunrise.edu', type: 'email' },
            { name: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
            { name: 'country', label: 'Country Code', placeholder: 'PK' },
          ].map(({ name, label, placeholder, type = 'text' }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                {...register(name as never)}
                type={type}
                placeholder={placeholder}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register School'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered?{' '}
          <a href="/login" className="text-purple-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
