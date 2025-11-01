
'use client';

import { logError } from '@/lib/logging';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

function EnrollSequenceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const companyId = searchParams?.get('companyId');

  // Fetch sequences with React Query
  const { data: allSequences = [], isLoading: loadingSequences } = useQuery({
    queryKey: ['sequences'],
    queryFn: async () => {
      const response = await fetch('/api/sequences');
      if (!response.ok) throw new Error('Failed to load sequences');
      return response.json();
    },
  });

  // Fetch company with React Query
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) throw new Error('Failed to load company');
      return response.json();
    },
    enabled: !!companyId,
  });

  // Filter to only active sequences
  const sequences = allSequences.filter((s: any) => s.active);
  const isLoading = loadingSequences || loadingCompany;

  const enrollMutation = useMutation({
    mutationFn: async (sequenceId: string) => {
      const response = await fetch(`/api/sequences/${sequenceId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Company enrolled in sequence!');
      router.push(`/companies/${companyId}`);
    },
    onError: (error: Error) => {
      logError('Enrollment error:', error);
      toast.error(error.message);
    }
  });

  const handleEnroll = (sequenceId: string) => {
    if (!companyId) {
      toast.error('No company selected');
      return;
    }
    enrollMutation.mutate(sequenceId);
  };

  if (!companyId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600">No company selected</p>
        <Link href="/companies">
          <Button className="mt-4">Go to Companies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enroll in Email Sequence</h1>
        {company && (
          <p className="text-gray-600 mt-1">
            Select a sequence for <strong>{company.name}</strong>
          </p>
        )}
      </div>

      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading sequences...</p>
        </Card>
      ) : sequences.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No active sequences available</p>
          <Link href="/sequences/new">
            <Button>Create First Sequence</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sequences.map((sequence: any) => (
            <Card
              key={sequence.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{sequence.name}</CardTitle>
                    {sequence.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {sequence.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>📧 {sequence._count?.steps || 0} email steps</span>
                    <span>👥 {sequence._count?.enrollments || 0} enrolled</span>
                  </div>

                  {sequence.pauseOnDealCreation && (
                    <p className="text-xs text-blue-600">
                      ⏸️ Automatically pauses when a deal is created
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleEnroll(sequence.id)}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Company'}
                    </Button>
                    <Link href={`/sequences/${sequence.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function EnrollSequencePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto py-12 text-center">Loading...</div>}>
      <EnrollSequenceForm />
    </Suspense>
  );
}

