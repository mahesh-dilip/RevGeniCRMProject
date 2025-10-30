'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function PeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/people');
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter(person => {
    const searchLower = search.toLowerCase();
    return (
      person.firstName.toLowerCase().includes(searchLower) ||
      person.lastName.toLowerCase().includes(searchLower) ||
      person.email?.toLowerCase().includes(searchLower) ||
      person.company.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">People</h1>
          <p className="text-gray-600">{people.length} contacts in your CRM</p>
        </div>
        <Link href="/people/new">
          <Button>+ Add Contact</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Search people by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Name</th>
                    <th className="text-left p-4 font-semibold text-sm">Title</th>
                    <th className="text-left p-4 font-semibold text-sm">Company</th>
                    <th className="text-left p-4 font-semibold text-sm">Email</th>
                    <th className="text-left p-4 font-semibold text-sm">Phone</th>
                    <th className="text-center p-4 font-semibold text-sm">Activities</th>
                    <th className="text-center p-4 font-semibold text-sm">Deals</th>
                    <th className="text-right p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPeople.map((person) => (
                    <tr key={person.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <Link
                          href={`/people/${person.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {person.firstName} {person.lastName}
                        </Link>
                      </td>
                      <td className="p-4 text-sm">{person.title || '-'}</td>
                      <td className="p-4">
                        <Link
                          href={`/companies/${person.company.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {person.company.name}
                        </Link>
                      </td>
                      <td className="p-4">
                        {person.email ? (
                          <a href={`mailto:${person.email}`} className="text-sm text-blue-600 hover:underline">
                            {person.email}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {person.phone ? (
                          <a href={`tel:${person.phone}`} className="text-sm text-blue-600 hover:underline">
                            {person.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-sm">{person._count?.events || 0}</td>
                      <td className="p-4 text-center text-sm">{person._count?.primaryDeals || 0}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/people/${person.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Link href={`/events/new?personId=${person.id}`}>
                            <Button size="sm">+ Activity</Button>
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
          </Card>
        </>
      )}
    </div>
  );
}
