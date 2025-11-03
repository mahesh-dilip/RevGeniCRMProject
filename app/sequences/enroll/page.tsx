
'use client';

import { logError } from '@/lib/logging';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Link from 'next/link';

function EnrollSequenceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const singleCompanyId = searchParams?.get('companyId');
  const bulkCompanyIds = searchParams?.get('companyIds');

  // Parse company IDs
  const companyIds = bulkCompanyIds ? bulkCompanyIds.split(',') : (singleCompanyId ? [singleCompanyId] : []);
  const isBulkEnrollment = companyIds.length > 1;

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set(companyIds));
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(companyIds.length === 0);

  // Fetch sequences with React Query
  const { data: allSequences = [], isLoading: loadingSequences } = useQuery({
    queryKey: ['sequences'],
    queryFn: async () => {
      const response = await fetch('/api/sequences');
      if (!response.ok) throw new Error('Failed to load sequences');
      return response.json();
    },
  });

  // Fetch all companies with React Query
  const { data: allCompanies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to load companies');
      return response.json();
    },
  });

  // Get companies to enroll - if showAllCompanies, show all; otherwise show pre-selected
  const companiesToEnroll = useMemo(() => {
    if (showAllCompanies) {
      return allCompanies;
    }
    return allCompanies.filter((c: any) => companyIds.includes(c.id));
  }, [allCompanies, companyIds, showAllCompanies]);

  // Filter companies by search query
  const filteredCompanies = useMemo(() => {
    if (!companySearchQuery) return companiesToEnroll;

    const query = companySearchQuery.toLowerCase();
    return companiesToEnroll.filter((c: any) =>
      c.name.toLowerCase().includes(query) ||
      c.industry?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    );
  }, [companiesToEnroll, companySearchQuery]);

  // Filter to only active sequences
  const sequences = allSequences.filter((s: any) => s.active);
  const isLoading = loadingSequences || loadingCompanies;

  const enrollMutation = useMutation({
    mutationFn: async (sequenceId: string) => {
      const idsToEnroll = Array.from(selectedCompanyIds);

      // Enroll all selected companies
      const promises = idsToEnroll.map(companyId =>
        fetch(`/api/sequences/${sequenceId}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId })
        }).then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `Failed to enroll company ${companyId}`);
          }
          return data;
        })
      );

      return Promise.all(promises);
    },
    onSuccess: (_, sequenceId) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['sequences'] });

      const count = selectedCompanyIds.size;
      toast.success(`${count} ${count === 1 ? 'company' : 'companies'} enrolled in sequence!`);
      router.push('/companies');
    },
    onError: (error: Error) => {
      logError('Enrollment error:', error);
      toast.error(error.message);
    }
  });

  const handleEnroll = (sequenceId: string) => {
    if (selectedCompanyIds.size === 0) {
      toast.error('No companies selected');
      return;
    }
    enrollMutation.mutate(sequenceId);
  };

  const toggleCompanySelection = (companyId: string) => {
    const newSelected = new Set(selectedCompanyIds);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanyIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCompanyIds.size === filteredCompanies.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(filteredCompanies.map((c: any) => c.id)));
    }
  };

  // Remove the early return - we'll show company selector instead

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enroll in Email Sequence</h1>
        <p className="text-gray-600 mt-1">
          {selectedCompanyIds.size > 0 ? (
            <>Select a sequence for <strong>{selectedCompanyIds.size} {selectedCompanyIds.size === 1 ? 'company' : 'companies'}</strong></>
          ) : (
            <>Search and select companies to enroll in a sequence</>
          )}
        </p>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </Card>
      ) : (
        <>
          {/* Company Selection - always show if searching all or have multiple companies */}
          {(showAllCompanies || isBulkEnrollment || companyIds.length === 0) && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Companies to Enroll</CardTitle>
                  {!showAllCompanies && companyIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllCompanies(true)}
                    >
                      + Add More Companies
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Input */}
                  <div>
                    <Input
                      type="text"
                      placeholder="Search companies by name, industry, or description..."
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Company List */}
                  <div className="border rounded-md">
                    <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-3">
                      <Checkbox
                        checked={selectedCompanyIds.size === filteredCompanies.length && filteredCompanies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="font-medium text-sm">
                        Select All ({selectedCompanyIds.size} of {companiesToEnroll.length} selected)
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {filteredCompanies.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No companies match your search</p>
                        </div>
                      ) : (
                        filteredCompanies.map((company: any) => (
                          <div
                            key={company.id}
                            className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                            onClick={() => toggleCompanySelection(company.id)}
                          >
                            <Checkbox
                              checked={selectedCompanyIds.has(company.id)}
                              onCheckedChange={() => toggleCompanySelection(company.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{company.name}</p>
                              {(company.industry || company.description) && (
                                <p className="text-xs text-gray-600 line-clamp-1">
                                  {company.industry && <span>{company.industry}</span>}
                                  {company.industry && company.description && <span> • </span>}
                                  {company.description && <span>{company.description}</span>}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary">{company.status}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {selectedCompanyIds.size === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
                      ⚠️ No companies selected. Please select at least one company to enroll.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sequence Selection */}
          {sequences.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-4">No active sequences available</p>
              <Link href="/sequences/new">
                <Button>Create First Sequence</Button>
              </Link>
            </Card>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-4">Select a Sequence</h2>
              </div>
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
                            disabled={enrollMutation.isPending || selectedCompanyIds.size === 0}
                          >
                            {enrollMutation.isPending ? 'Enrolling...' : `Enroll ${selectedCompanyIds.size} ${selectedCompanyIds.size === 1 ? 'Company' : 'Companies'}`}
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
            </>
          )}
        </>
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

