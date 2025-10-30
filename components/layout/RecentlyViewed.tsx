'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRecentlyViewed } from '@/lib/utils/recently-viewed';

interface RecentItem {
  id: string;
  name: string;
  type: 'company' | 'deal' | 'person';
  timestamp: number;
}

interface RecentlyViewedData {
  companies: RecentItem[];
  deals: RecentItem[];
  people: RecentItem[];
}

export function RecentlyViewed() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentlyViewedData>({
    companies: [],
    deals: [],
    people: []
  });

  useEffect(() => {
    if (isOpen) {
      setRecentItems(getRecentlyViewed());
    }
  }, [isOpen]);

  const totalItems = recentItems.companies.length + recentItems.deals.length + recentItems.people.length;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-gray-900"
      >
        🕐 Recent
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 mt-2 w-72 p-4 z-20 shadow-lg">
            <h3 className="font-semibold mb-3 text-sm">Recently Viewed</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentItems.companies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Companies</p>
                  <div className="space-y-1">
                    {recentItems.companies.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          router.push(`/companies/${item.id}`);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 truncate"
                      >
                        🏢 {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recentItems.deals.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Deals</p>
                  <div className="space-y-1">
                    {recentItems.deals.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          router.push(`/deals/${item.id}`);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 truncate"
                      >
                        💼 {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recentItems.people.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">People</p>
                  <div className="space-y-1">
                    {recentItems.people.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          router.push(`/people/${item.id}`);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 truncate"
                      >
                        👤 {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

