import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
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
      <html lang="en">
        <body className={inter.className}>
          <ReactQueryProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <Toaster richColors position="top-right" />
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
