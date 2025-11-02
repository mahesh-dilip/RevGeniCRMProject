
'use client';

import { logError } from '@/lib/logging';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { QualifyLeadButton } from './components/QualifyLeadButton';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { addRecentlyViewed } from '@/lib/utils/recently-viewed';

type TabType = 'overview' | 'people' | 'deals' | 'activity';

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    fetchCompany();
  }, [params.id]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${params.id}`);

      if (!response.ok) {
        throw new Error('Company not found');
      }

      const data = await response.json();
      setCompany(data);
      
      // Track recently viewed
      addRecentlyViewed({
        id: data.id,
        name: data.name,
        type: 'company'
      });
    } catch (error) {
      logError('Error fetching company:', error);
      toast.error('Failed to load company');
      router.push('/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete company');
      }

      toast.success('Company deleted successfully');
      router.push('/companies');
    } catch (error) {
      logError('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      Lead: 'default',
      Qualified: 'secondary',
      Customer: 'success',
      Lost: 'destructive',
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading company details...</div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Companies', href: '/companies' },
        { label: company.name }
      ]} />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.sourceType === 'ai_agent' && (
                <Badge variant="outline">
                  🤖 AI Generated
                  {company.confidence && ` (${Math.round(company.confidence * 100)}%)`}
                </Badge>
              )}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                🔗 {company.website}
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/companies/${params.id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <Card className="bg-gray-50">
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-2">
              <Link href={`/deals/new?companyId=${company.id}`}>
                <Button variant="default" size="sm">
                  💼 Create Deal
                </Button>
              </Link>
              <Link href={`/sequences/enroll?companyId=${company.id}`}>
                <Button variant="default" size="sm">
                  📧 Enroll in Sequence
                </Button>
              </Link>
              <Link href={`/events/new?companyId=${company.id}`}>
                <Button variant="outline" size="sm">
                  📅 Log Activity
                </Button>
              </Link>
              <Link href={`/people/new?companyId=${company.id}`}>
                <Button variant="outline" size="sm">
                  👤 Add Person
                </Button>
              </Link>
              <Link href={`/ai-people-finder?company=${encodeURIComponent(company.name)}`}>
                <Button variant="outline" size="sm">
                  🤖 Find People
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Pipeline */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Company Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {[
              { value: 'Lead', label: 'Lead', color: 'bg-gray-400', icon: '🎯' },
              { value: 'Qualified', label: 'Qualified', color: 'bg-blue-500', icon: '✅' },
              { value: 'Customer', label: 'Customer', color: 'bg-green-500', icon: '🏆' },
              { value: 'Lost', label: 'Lost', color: 'bg-red-500', icon: '❌' }
            ].map((status, index, arr) => {
              const isActive = company.status === status.value;
              const isPast = arr.findIndex(s => s.value === company.status) > index;
              const isFuture = arr.findIndex(s => s.value === company.status) < index;

              return (
                <div key={status.value} className="flex items-center flex-1">
                  <button
                    onClick={async () => {
                      if (status.value === company.status) return;

                      try {
                        const response = await fetch(`/api/companies/${params.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: status.value })
                        });

                        if (!response.ok) throw new Error('Failed to update status');

                        toast.success(`Status updated to ${status.value}`);
                        fetchCompany();
                      } catch (error) {
                        logError('Error updating status:', error);
                        toast.error('Failed to update status');
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-full px-3 py-3 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? `${status.color} text-white font-semibold shadow-lg scale-105`
                        : isPast
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                    }`}
                  >
                    <span className="text-2xl mb-1">{status.icon}</span>
                    <span className="text-sm font-medium">{status.label}</span>
                    {isActive && (
                      <span className="text-xs mt-1 opacity-90">Current</span>
                    )}
                  </button>

                  {index < arr.length - 1 && (
                    <div className="flex-shrink-0 w-8 mx-1">
                      <div className={`h-1 ${isPast ? status.color : 'bg-gray-300'} transition-all`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            Click on any status to update the company's stage
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'people', label: `People (${company._count.people})` },
            { id: 'deals', label: `Deals (${company._count.deals})` },
            { id: 'activity', label: `Activity (${company._count.events})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {company.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">{company.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {company.industry && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                        <p className="mt-1 text-sm text-gray-900">🏭 {company.industry}</p>
                      </div>
                    )}

                    {company.geography && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p className="mt-1 text-sm text-gray-900">📍 {company.geography}</p>
                      </div>
                    )}

                    {company.size && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Company Size</h3>
                        <p className="mt-1 text-sm text-gray-900">👥 {company.size}</p>
                      </div>
                    )}

                    {company.foundedYear && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Founded</h3>
                        <p className="mt-1 text-sm text-gray-900">{company.foundedYear}</p>
                      </div>
                    )}
                  </div>

                  {company.sourceQuery && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Source Query</h3>
                      <p className="mt-1 text-sm text-gray-600 italic">{company.sourceQuery}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">People</span>
                    <span className="text-sm font-semibold">{company._count.people}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deals</span>
                    <span className="text-sm font-semibold">{company._count.deals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Activities</span>
                    <span className="text-sm font-semibold">{company._count.events}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-semibold">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">People</h2>
              <Link href={`/people/new?companyId=${company.id}`}>
                <Button size="sm">Add Person</Button>
              </Link>
            </div>

            {company.people.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No people added yet</p>
                  <Link href={`/people/new?companyId=${company.id}`}>
                    <Button>Add First Person</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.people.map((person: any) => (
                  <Card key={person.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg">
                        {person.firstName} {person.lastName}
                      </h3>
                      {person.title && (
                        <p className="text-sm text-gray-600">{person.title}</p>
                      )}
                      <div className="mt-3 space-y-1 text-sm">
                        {person.email && (
                          <div className="flex items-center gap-2">
                            <span>📧</span>
                            <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">
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
                              className="text-blue-600 hover:underline"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Deals</h2>
              <Link href={`/deals/new?companyId=${company.id}`}>
                <Button size="sm">Create Deal</Button>
              </Link>
            </div>

            {company.deals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No deals yet</p>
                  <Link href={`/deals/new?companyId=${company.id}`}>
                    <Button>Create First Deal</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {company.deals.map((deal: any) => (
                  <Card key={deal.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{deal.title}</h3>
                          {deal.description && (
                            <p className="text-sm text-gray-600 mt-1">{deal.description}</p>
                          )}
                        </div>
                        <Badge>{deal.stage}</Badge>
                      </div>

                      <div className="flex gap-4 mt-3 text-sm text-gray-600">
                        {deal.value && (
                          <div>
                            💰 ${deal.value.toLocaleString()}
                          </div>
                        )}
                        {deal.probability && (
                          <div>
                            📊 {deal.probability}% probability
                          </div>
                        )}
                        {deal.closeDate && (
                          <div>
                            📅 Close: {new Date(deal.closeDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <Link href={`/deals/${deal.id}`}>
                          <Button variant="outline" size="sm">View Deal</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Activity Timeline</h2>
              <Link href={`/events/new?companyId=${company.id}`}>
                <Button size="sm">Add Event</Button>
              </Link>
            </div>

            {company.events.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">No activity yet</p>
                  <Link href={`/events/new?companyId=${company.id}`}>
                    <Button>Add First Event</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {company.events.map((event: any) => (
                  <Card key={event.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {event.type === 'call' && '📞'}
                          {event.type === 'email' && '📧'}
                          {event.type === 'meeting' && '🤝'}
                          {event.type === 'task' && '✅'}
                          {event.type === 'note' && '📝'}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                            </div>
                            {event.completed !== undefined && (
                              <Badge variant={event.completed ? 'success' : 'secondary'}>
                                {event.completed ? 'Completed' : 'Pending'}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                            {event.person && (
                              <span>👤 {event.person.firstName} {event.person.lastName}</span>
                            )}
                            {event.deal && (
                              <span>💼 {event.deal.title}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
