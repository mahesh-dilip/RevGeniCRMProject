
'use client';

import { logError } from '@/lib/logging';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

function EnrollSequenceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams?.get('companyId');
  
  const [loading, setLoading] = useState(false);
  const [sequences, setSequences] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    try {
      const [sequencesRes, companyRes] = await Promise.all([
        fetch('/api/sequences'),
        fetch(`/api/companies/${companyId}`)
      ]);

      const sequencesData = await sequencesRes.json();
      const companyData = await companyRes.json();

      // Only show active sequences
      setSequences(sequencesData.filter((s: any) => s.active));
      setCompany(companyData);
    } catch (error) {
      logError('Error fetching data:', error);
      toast.error('Failed to load sequences');
    }
  };

  const handleEnroll = async (sequenceId: string) => {
    if (!companyId) {
      toast.error('No company selected');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/sequences/${sequenceId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      toast.success('Company enrolled in sequence!');
      router.push(`/companies/${companyId}`);
    } catch (error) {
      logError('Enrollment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll');
    } finally {
      setLoading(false);
    }
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

      {sequences.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No active sequences available</p>
          <Link href="/sequences/new">
            <Button>Create First Sequence</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sequences.map((sequence) => (
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
                      disabled={loading}
                    >
                      {loading ? 'Enrolling...' : 'Enroll Company'}
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

