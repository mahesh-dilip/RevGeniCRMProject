'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function NewActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams?.get('companyId');
  const preselectedDealId = searchParams?.get('dealId');
  const preselectedType = searchParams?.get('type');

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    type: preselectedType || 'call',
    title: '',
    description: '',
    outcome: '',
    companyId: preselectedCompanyId || '',
    personId: '',
    dealId: preselectedDealId || '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.companyId) {
      fetchPeopleForCompany(formData.companyId);
      fetchDealsForCompany(formData.companyId);
    } else {
      setPeople([]);
      setDeals([]);
    }
  }, [formData.companyId]);

  const fetchData = async () => {
    try {
      const companiesResponse = await fetch('/api/companies');
      const companiesData = await companiesResponse.json();
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const fetchPeopleForCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/people?companyId=${companyId}`);
      const data = await response.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching people:', error);
    }
  };

  const fetchDealsForCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/deals?companyId=${companyId}`);
      const data = await response.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || null,
          personId: formData.personId || null,
          dealId: formData.dealId || null,
          completed: true, // Activities are completed by default since they already happened
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log activity');
      }

      const activity = await response.json();
      toast.success(`Activity "${activity.title}" logged successfully!`);

      // Navigate based on context
      if (preselectedCompanyId) {
        router.push(`/companies/${preselectedCompanyId}`);
      } else if (preselectedDealId) {
        router.push(`/deals/${preselectedDealId}`);
      } else {
        router.push('/activities');
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = [
    { value: 'call', label: '📞 Call', description: 'Phone conversation' },
    { value: 'email', label: '📧 Email', description: 'Email communication' },
    { value: 'meeting', label: '🤝 Meeting', description: 'In-person or virtual meeting' },
    { value: 'note', label: '📝 Note', description: 'General note or observation' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Log an Activity</h1>
        <p className="text-gray-600 mt-1">
          Record a past interaction with a customer
        </p>
      </div>

      <Card className="bg-blue-50 border-l-4 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Logging Past Activities</h3>
              <p className="text-sm text-blue-800">
                Use this form to record interactions that have already happened - calls you made, emails you sent,
                meetings you attended, or notes from conversations. For action items you need to complete in the future,
                use <a href="/tasks/new" className="underline">Create Task</a> instead.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Activity Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {activityTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-3 border rounded-md text-left transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">{type.label}</div>
                    <div className="text-xs text-gray-600">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Discussed pricing with John, Sent proposal follow-up"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                placeholder="What was discussed? Any important details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="outcome">Outcome (Optional)</Label>
              <Input
                id="outcome"
                placeholder="e.g., Scheduled demo for next week, Need to send additional info"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                What was the result or next step?
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Link to Records (Optional)</h3>
              <p className="text-xs text-gray-500 mb-4">
                Associate this activity with a company, contact, or deal
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyId">Company</Label>
                  <select
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value, personId: '', dealId: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.companyId && (
                  <>
                    <div>
                      <Label htmlFor="personId">Contact</Label>
                      <select
                        id="personId"
                        value={formData.personId}
                        onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={people.length === 0}
                      >
                        <option value="">None</option>
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="dealId">Deal</Label>
                      <select
                        id="dealId"
                        value={formData.dealId}
                        onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={deals.length === 0}
                      >
                        <option value="">None</option>
                        {deals.map((deal) => (
                          <option key={deal.id} value={deal.id}>
                            {deal.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Logging...' : 'Log Activity'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewActivityPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12 text-center">Loading...</div>}>
      <NewActivityForm />
    </Suspense>
  );
}
