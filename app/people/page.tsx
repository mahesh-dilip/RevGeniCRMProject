
'use client';

import { logError } from '@/lib/logging';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

export default function PeoplePage() {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch people with React Query
  const { data: people = [], isLoading: loading } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const response = await fetch('/api/people');
      if (!response.ok) {
        throw new Error('Failed to fetch people');
      }
      return response.json();
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalWithEmail = people.filter((p: any) => p.email).length;
    const totalWithDeals = people.filter((p: any) => (p._count?.primaryDeals || 0) > 0).length;
    const totalWithActivities = people.filter((p: any) => (p._count?.events || 0) > 0).length;

    // Get top companies
    const companyCounts = people.reduce((acc: any, p: any) => {
      const companyName = p.company?.name || 'Unknown';
      acc[companyName] = (acc[companyName] || 0) + 1;
      return acc;
    }, {});

    const topCompanies = Object.entries(companyCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    return {
      total: people.length,
      withEmail: totalWithEmail,
      withDeals: totalWithDeals,
      withActivities: totalWithActivities,
      topCompanies,
    };
  }, [people]);

  const filteredPeople = people.filter((person: any) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      person.firstName.toLowerCase().includes(searchLower) ||
      person.lastName.toLowerCase().includes(searchLower) ||
      person.email?.toLowerCase().includes(searchLower) ||
      person.title?.toLowerCase().includes(searchLower) ||
      person.company.name.toLowerCase().includes(searchLower);

    const matchesCompany = !companyFilter || person.company.name === companyFilter;

    return matchesSearch && matchesCompany;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeople = filteredPeople.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCompanyFilter = (company: string | null) => {
    setCompanyFilter(company);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">People</h1>
          <p className="text-gray-600">{people.length} contacts in your CRM</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ai-people-finder">
            <Button variant="outline">🤖 Find People with AI</Button>
          </Link>
          <Link href="/people/new">
            <Button>+ Add Contact</Button>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total People</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">With Email</p>
              <p className="text-2xl font-bold">{stats.withEmail}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">With Deals</p>
              <p className="text-2xl font-bold">{stats.withDeals}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{stats.withActivities}</p>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="Search people by name, email, title, or company..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="md:max-w-md"
            />
            <div className="flex gap-2 items-center">
              <label htmlFor="company-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Company:
              </label>
              <select
                id="company-filter"
                value={companyFilter || ''}
                onChange={(e) => handleCompanyFilter(e.target.value || null)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="">All Companies</option>
                {stats.topCompanies.map((company: string) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Name</th>
                    <th className="text-left p-4 font-semibold text-sm">Title</th>
                    <th className="text-left p-4 font-semibold text-sm">Company</th>
                    <th className="text-left p-4 font-semibold text-sm">Email</th>
                    <th className="text-right p-4 font-semibold text-sm">Activities</th>
                    <th className="text-right p-4 font-semibold text-sm">Deals</th>
                    <th className="text-right p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPeople.map((person: any) => (
                    <tr key={person.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                      if ((e.target as HTMLElement).closest('a, button')) return;
                      window.location.href = `/people/${person.id}`;
                    }}>
                      <td className="p-4">
                        <Link
                          href={`/people/${person.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {person.firstName} {person.lastName}
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{person.title || '-'}</td>
                      <td className="p-4">
                        <Link
                          href={`/companies/${person.company.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {person.company.name}
                        </Link>
                      </td>
                      <td className="p-4">
                        {person.email ? (
                          <a href={`mailto:${person.email}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                            {person.email}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-sm font-medium text-gray-900">{person._count?.events || 0}</td>
                      <td className="p-4 text-right text-sm font-medium text-gray-900">{person._count?.primaryDeals || 0}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/events/new?personId=${person.id}`}>
                            <Button size="sm" variant="outline">+ Activity</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPeople.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {people.length === 0 ? (
                    <>
                      <p className="mb-4">No contacts yet.</p>
                      <Link href="/people/new">
                        <Button>+ Add Your First Contact</Button>
                      </Link>
                    </>
                  ) : (
                    <p>No contacts match your search.</p>
                  )}
                </div>
              )}
            </div>

            {filteredPeople.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredPeople.length}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
