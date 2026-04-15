import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Bizvinc School — AI-Native School Management',
  description: 'The operating system for every school globally.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
