'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const response = await fetch('/api/sequences');
      const data = await response.json();
      setSequences(data);
    } catch (error) {
      console.error('Error fetching sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Sequences</h1>
        <Link href="/sequences/new">
          <Button>➕ Create Sequence</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && sequences.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">
              No email sequences yet. Create one to automate your outreach!
            </p>
            <Link href="/sequences/new">
              <Button>➕ Create Your First Sequence</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sequences.map((sequence) => (
          <Card key={sequence.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{sequence.name}</CardTitle>
                <Badge variant={sequence.active ? 'success' : 'secondary'}>
                  {sequence.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {sequence.description || 'No description'}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Steps:</span>
                  <span className="font-medium">{sequence.steps?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Enrollments:</span>
                  <span className="font-medium">
                    {sequence._count?.enrollments || 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button size="sm" variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
