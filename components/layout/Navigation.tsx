'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RecentlyViewed } from './RecentlyViewed';
import { UserButton } from '@clerk/nextjs';

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Companies', href: '/companies' },
  { name: 'People', href: '/people' },
  { name: 'Deals', href: '/deals' },
  { name: 'Tasks', href: '/tasks' },
  { name: 'Activities', href: '/activities' },
  { name: 'Sequences', href: '/sequences' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              RevGeni CRM
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RecentlyViewed />
            <div className="text-sm text-gray-500">Press ⌘K to search</div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}
