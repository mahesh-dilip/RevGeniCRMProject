'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

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
        <h1 className="text-3xl font-bold">People</h1>
        <Link href="/people/new">
          <Button>Add Person</Button>
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

      {!loading && people.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">
              No people yet. Start by adding your first contact!
            </p>
            <Link href="/people/new">
              <Button>Add First Person</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && people.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Showing {filteredPeople.length} of {people.length} people
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person) => (
              <Card key={person.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {person.firstName} {person.lastName}
                      </h3>
                      {person.title && (
                        <p className="text-sm text-gray-600">{person.title}</p>
                      )}
                    </div>
                  </div>

                  <Link href={`/companies/${person.company.id}`}>
                    <div className="text-sm text-blue-600 hover:underline mb-3">
                      🏢 {person.company.name}
                    </div>
                  </Link>

                  <div className="space-y-1 text-sm mb-3">
                    {person.email && (
                      <div className="flex items-center gap-2">
                        <span>📧</span>
                        <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline truncate">
                          {person.email}
                        </a>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span>{person.phone}</span>
                      </div>
                    )}
                    {person.linkedin && (
                      <div className="flex items-center gap-2">
                        <span>🔗</span>
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>

                  {person._count && (
                    <div className="flex gap-4 text-xs text-gray-500 mb-3 pt-3 border-t">
                      <span>💼 {person._count.primaryDeals} deals</span>
                      <span>📅 {person._count.events} events</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/people/${person.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/people/${person.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
