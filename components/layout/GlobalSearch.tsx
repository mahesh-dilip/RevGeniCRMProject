'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    companies: [],
    people: [],
    deals: []
  });
  const [loading, setLoading] = useState(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults({ companies: [], people: [], deals: [] });
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  const totalResults = results.companies.length + results.people.length + results.deals.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4">
        <Card className="p-4">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search companies, people, deals... (Cmd+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="text-lg"
            />
          </div>

          {loading && (
            <div className="text-center text-gray-500 py-8">Searching...</div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="text-center text-gray-500 py-8">
              No results found for "{query}"
            </div>
          )}

          {!loading && totalResults > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Companies */}
              {results.companies.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Companies ({results.companies.length})
                  </h3>
                  <div className="space-y-1">
                    {results.companies.map((company: any) => (
                      <button
                        key={company.id}
                        onClick={() => handleNavigate(`/companies/${company.id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium">🏢 {company.name}</div>
                        {company.industry && (
                          <div className="text-xs text-gray-500">{company.industry}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* People */}
              {results.people.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    People ({results.people.length})
                  </h3>
                  <div className="space-y-1">
                    {results.people.map((person: any) => (
                      <button
                        key={person.id}
                        onClick={() => handleNavigate(`/people/${person.id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium">
                          👤 {person.firstName} {person.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {person.title && `${person.title} • `}
                          {person.company?.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Deals */}
              {results.deals.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Deals ({results.deals.length})
                  </h3>
                  <div className="space-y-1">
                    {results.deals.map((deal: any) => (
                      <button
                        key={deal.id}
                        onClick={() => handleNavigate(`/deals/${deal.id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium">💼 {deal.title}</div>
                        <div className="text-xs text-gray-500">
                          {deal.stage} • {deal.company?.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t text-xs text-gray-500 flex justify-between">
            <span>Press ESC to close</span>
            <span>↑↓ to navigate • Enter to select</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

