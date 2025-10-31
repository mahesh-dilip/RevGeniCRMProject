
'use client';

import { logError } from '@/lib/logging';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SequencesPage() {
  // Fetch sequences with React Query
  const { data: sequences = [], isLoading: loading } = useQuery({
    queryKey: ['sequences'],
    queryFn: async () => {
      const response = await fetch('/api/sequences');
      if (!response.ok) {
        throw new Error('Failed to fetch sequences');
      }
      return response.json();
    },
  });

  const activeSequences = sequences.filter((s: any) => s.active).length;
  const totalEnrollments = sequences.reduce((sum: number, s: any) => sum + (s._count?.enrollments || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Sequences</h1>
          <p className="text-gray-600">{sequences.length} sequences • {totalEnrollments} total enrollments</p>
        </div>
        <Link href="/sequences/new">
          <Button>+ Create Sequence</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Sequences</p>
              <p className="text-2xl font-bold">{sequences.length}</p>
            </Card>
            <Card className="p-4 bg-green-50">
              <p className="text-sm text-gray-600">Active Sequences</p>
              <p className="text-2xl font-bold">{activeSequences}</p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold">{totalEnrollments}</p>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Sequence Name</th>
                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                    <th className="text-right p-4 font-semibold text-sm">Steps</th>
                    <th className="text-right p-4 font-semibold text-sm">Enrollments</th>
                    <th className="text-left p-4 font-semibold text-sm">Settings</th>
                    <th className="text-left p-4 font-semibold text-sm">Created</th>
                    <th className="text-right p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sequences.map((sequence: any) => (
                    <tr key={sequence.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                      if ((e.target as HTMLElement).closest('a, button')) return;
                      window.location.href = `/sequences/${sequence.id}`;
                    }}>
                      <td className="p-4">
                        <div>
                          <Link
                            href={`/sequences/${sequence.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {sequence.name}
                          </Link>
                          {sequence.description && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {sequence.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={sequence.active ? 'default' : 'secondary'}>
                          {sequence.active ? '✓ Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-medium text-gray-900">{sequence.steps?.length || 0}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {sequence._count?.enrollments || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-600">
                          {sequence.pauseOnDealCreation && (
                            <span className="block">⏸️ Pause on deal</span>
                          )}
                          {sequence.pauseOnDealStages?.length > 0 && (
                            <span className="block">⏸️ Stage pauses</span>
                          )}
                          {!sequence.pauseOnDealCreation && !sequence.pauseOnDealStages?.length && (
                            <span className="text-gray-400">No automation</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {format(new Date(sequence.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/sequences/${sequence.id}/edit`}>
                            <Button size="sm" variant="outline">Edit</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sequences.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No email sequences yet.</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Create automated email sequences to nurture leads and follow up with prospects.
                  </p>
                  <Link href="/sequences/new">
                    <Button>+ Create Your First Sequence</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
