
'use client';

import { logError } from '@/lib/logging';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function CompaniesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  // Fetch companies with React Query
  const { data: companies = [], isLoading: loading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      return response.json();
    },
  });

  const filteredCompanies = statusFilter
    ? companies.filter((c: any) => c.status === statusFilter)
    : companies;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map((c: any) => c.id)));
    }
  };

  // Mutation for bulk status updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const promises = ids.map(id =>
        fetch(`/api/companies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        }).then(res => {
          if (!res.ok) throw new Error('Failed to update company');
          return res.json();
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, { ids, status }) => {
      // Invalidate companies query to refetch data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`Updated ${ids.length} companies to ${status}`);
      setSelectedIds(new Set());
      setBulkAction('');
    },
    onError: (error) => {
      logError('Failed to update companies:', error);
      toast.error('Failed to update companies');
    },
  });

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) {
      toast.error('No companies selected');
      return;
    }

    if (bulkAction === 'enroll-sequence') {
      // Navigate to enrollment with multiple companies
      const ids = Array.from(selectedIds).join(',');
      router.push(`/sequences/enroll?companyIds=${ids}`);
    } else if (bulkAction === 'change-status') {
      const newStatus = prompt('Enter new status (Lead, Qualified, Customer, Lost):');
      if (!newStatus) return;

      updateStatusMutation.mutate({
        ids: Array.from(selectedIds),
        status: newStatus,
      });
    }
  };

  const stats = {
    total: companies.length,
    lead: companies.filter((c: any) => c.status === 'Lead').length,
    qualified: companies.filter((c: any) => c.status === 'Qualified').length,
    customer: companies.filter((c: any) => c.status === 'Customer').length,
    aiGenerated: companies.filter((c: any) => c.sourceType === 'ai_agent').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-gray-600">{companies.length} companies in your CRM</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ai-lead-finder">
            <Button>🤖 Find Leads with AI</Button>
          </Link>
          <Link href="/companies/new">
            <Button variant="outline">+ Add Company</Button>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Leads</p>
              <p className="text-2xl font-bold">{stats.lead}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-2xl font-bold">{stats.qualified}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Customers</p>
              <p className="text-2xl font-bold">{stats.customer}</p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600">AI Generated</p>
              <p className="text-2xl font-bold">🤖 {stats.aiGenerated}</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!statusFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'Lead' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Lead')}
            >
              Leads
            </Button>
            <Button
              variant={statusFilter === 'Qualified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Qualified')}
            >
              Qualified
            </Button>
            <Button
              variant={statusFilter === 'Customer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Customer')}
            >
              Customers
            </Button>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {selectedIds.size} {selectedIds.size === 1 ? 'company' : 'companies'} selected
                </span>
                <div className="flex gap-2">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="border rounded px-3 py-1"
                  >
                    <option value="">Select action...</option>
                    <option value="enroll-sequence">Enroll in Sequence</option>
                    <option value="change-status">Change Status</option>
                  </select>
                  <Button onClick={handleBulkAction} disabled={!bulkAction}>
                    Apply
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedIds(new Set())}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                      <Checkbox
                        checked={selectedIds.size === filteredCompanies.length && filteredCompanies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-sm">Company</th>
                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                    <th className="text-left p-4 font-semibold text-sm">Industry</th>
                    <th className="text-right p-4 font-semibold text-sm">People</th>
                    <th className="text-right p-4 font-semibold text-sm">Deals</th>
                    <th className="text-right p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company: any) => (
                    <tr key={company.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input, a, button')) return;
                      window.location.href = `/companies/${company.id}`;
                    }}>
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedIds.has(company.id)}
                          onCheckedChange={() => toggleSelect(company.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <Link
                            href={`/companies/${company.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {company.name}
                          </Link>
                          {company.sourceType === 'ai_agent' && (
                            <Badge variant="outline" className="ml-2 text-xs">🤖 AI</Badge>
                          )}
                          {company.description && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {company.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          company.status === 'Customer' ? 'default' :
                          company.status === 'Qualified' ? 'default' :
                          'secondary'
                        }>
                          {company.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{company.industry || '-'}</td>
                      <td className="p-4 text-right text-sm font-medium text-gray-900">{company._count?.people || 0}</td>
                      <td className="p-4 text-right text-sm font-medium text-gray-900">{company._count?.deals || 0}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/deals/new?companyId=${company.id}`}>
                            <Button size="sm" variant="outline">+ Deal</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCompanies.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No companies found.</p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/ai-lead-finder">
                      <Button>🤖 Find Leads with AI</Button>
                    </Link>
                    <Link href="/companies/new">
                      <Button variant="outline">+ Add Manually</Button>
                    </Link>
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
