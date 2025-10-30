'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams?.get('companyId');
  const preselectedDealId = searchParams?.get('dealId');

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    type: 'task',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
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
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const fetchPeopleForCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/people?companyId=${companyId}`);
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    }
  };

  const fetchDealsForCompany = async (companyId: string) => {
    try {
      const response = await fetch(`/api/deals?companyId=${companyId}`);
      const data = await response.json();
      setDeals(data);
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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const event = await response.json();
      toast.success(`Event "${event.title}" created successfully!`);

      // Navigate based on context
      if (preselectedCompanyId) {
        router.push(`/companies/${preselectedCompanyId}`);
      } else if (preselectedDealId) {
        router.push(`/deals/${preselectedDealId}`);
      } else {
        router.push('/events');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    { value: 'call', label: '📞 Call', description: 'Phone call with customer' },
    { value: 'email', label: '📧 Email', description: 'Email communication' },
    { value: 'meeting', label: '🤝 Meeting', description: 'In-person or virtual meeting' },
    { value: 'task', label: '✅ Task', description: 'Task or to-do item' },
    { value: 'note', label: '📝 Note', description: 'General note or observation' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Event</h1>
        <p className="text-gray-600 mt-1">Track activities, tasks, and interactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Event Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {eventTypes.map((type) => (
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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Follow up on proposal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this event..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Link to Records (Optional)</h3>

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
                      <Label htmlFor="personId">Person</Label>
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
                      {people.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No people found for this company
                        </p>
                      )}
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
                      {deals.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No deals found for this company
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
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

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12 text-center">Loading...</div>}>
      <NewEventForm />
    </Suspense>
  );
}
