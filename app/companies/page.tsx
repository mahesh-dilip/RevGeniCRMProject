
'use client';

import { logError } from '@/lib/logging';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      logError('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = statusFilter
    ? companies.filter(c => c.status === statusFilter)
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
      setSelectedIds(new Set(filteredCompanies.map(c => c.id)));
    }
  };

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

      try {
        const promises = Array.from(selectedIds).map(id =>
          fetch(`/api/companies/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        );
        
        await Promise.all(promises);
        toast.success(`Updated ${selectedIds.size} companies to ${newStatus}`);
        setSelectedIds(new Set());
        fetchCompanies();
      } catch (error) {
        toast.error('Failed to update companies');
      }
    }
  };

  const stats = {
    total: companies.length,
    lead: companies.filter(c => c.status === 'Lead').length,
    qualified: companies.filter(c => c.status === 'Qualified').length,
    customer: companies.filter(c => c.status === 'Customer').length,
    aiGenerated: companies.filter(c => c.sourceType === 'ai_agent').length
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
                    <th className="text-left p-4 font-semibold text-sm">Size</th>
                    <th className="text-left p-4 font-semibold text-sm">Lead Score</th>
                    <th className="text-center p-4 font-semibold text-sm">Contacts</th>
                    <th className="text-center p-4 font-semibold text-sm">Deals</th>
                    <th className="text-right p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b hover:bg-gray-50">
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
                            className="font-medium hover:text-blue-600"
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
                      <td className="p-4 text-sm">{company.industry || '-'}</td>
                      <td className="p-4 text-sm">{company.size || '-'}</td>
                      <td className="p-4">
                        {company.leadScore !== null && company.leadScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  company.leadScore >= 80 ? 'bg-green-500' :
                                  company.leadScore >= 60 ? 'bg-blue-500' :
                                  company.leadScore >= 40 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${company.leadScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{company.leadScore}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-sm">{company._count?.people || 0}</td>
                      <td className="p-4 text-center text-sm">{company._count?.deals || 0}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/companies/${company.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Link href={`/deals/new?companyId=${company.id}`}>
                            <Button size="sm">+ Deal</Button>
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
