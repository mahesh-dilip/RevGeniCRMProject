import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactQueryProvider } from '@/lib/react-query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RevGeni CRM - AI-Powered Lead Generation',
  description: 'CRM with integrated AI Worker for intelligent lead discovery',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ReactQueryProvider>
        <html lang="en">
          <body className={inter.className}>
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <GlobalSearch />
            <Toaster richColors position="top-right" />
          </body>
        </html>
      </ReactQueryProvider>
    </ClerkProvider>
  );
}
