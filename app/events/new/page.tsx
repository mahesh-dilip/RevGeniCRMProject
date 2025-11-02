
'use client';

import { logError } from '@/lib/logging';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function NewEventForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams?.get('companyId');
  const preselectedDealId = searchParams?.get('dealId');

  const [formData, setFormData] = useState({
    type: 'task',
    title: '',
    description: '',
    dueDate: '',
    activityDate: '',
    priority: 'medium',
    companyId: preselectedCompanyId || '',
    personId: '',
    dealId: preselectedDealId || '',
  });

  // Fetch companies with React Query
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to load companies');
      return response.json();
    },
  });

  // Fetch people for selected company
  const { data: people = [] } = useQuery({
    queryKey: ['people', formData.companyId],
    queryFn: async () => {
      if (!formData.companyId) return [];
      const response = await fetch(`/api/people?companyId=${formData.companyId}`);
      if (!response.ok) throw new Error('Failed to load people');
      return response.json();
    },
    enabled: !!formData.companyId,
  });

  // Fetch deals for selected company
  const { data: deals = [] } = useQuery({
    queryKey: ['deals', formData.companyId],
    queryFn: async () => {
      if (!formData.companyId) return [];
      const response = await fetch(`/api/deals?companyId=${formData.companyId}`);
      if (!response.ok) throw new Error('Failed to load deals');
      return response.json();
    },
    enabled: !!formData.companyId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      return response.json();
    },
    onSuccess: (event) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });

      toast.success(`Event "${event.title}" created successfully!`);

      // Navigate based on context
      if (preselectedCompanyId) {
        router.push(`/companies/${preselectedCompanyId}`);
      } else if (preselectedDealId) {
        router.push(`/deals/${preselectedDealId}`);
      } else {
        router.push('/events');
      }
    },
    onError: (error: Error) => {
      logError('Error creating event:', error);
      toast.error(error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare the data based on event type
    const submitData: any = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      companyId: formData.companyId || null,
      personId: formData.personId || null,
      dealId: formData.dealId || null,
    };

    // For tasks, include due date and priority
    if (formData.type === 'task') {
      submitData.dueDate = formData.dueDate || null;
      submitData.priority = formData.priority;
    } else {
      // For activities, include activity date
      submitData.activityDate = formData.activityDate || null;
    }

    createEventMutation.mutate(submitData);
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
        <h1 className="text-3xl font-bold">Log an Activity</h1>
        <p className="text-gray-600 mt-1">
          Record past interactions, tasks, and communications with customers
        </p>
      </div>

      <Card className="bg-blue-50 border-l-4 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">What are Events?</h3>
              <p className="text-sm text-blue-800">
                Events are records of all your customer interactions and activities. This includes calls you've made,
                emails you've sent, meetings you've had, and tasks you need to complete. All event types are tracked
                in the activity timeline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Event Type *</Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Select the type of activity you want to log. <strong>Note:</strong> "Task" is an event type for
                to-do items and action items, just like calls, emails, and meetings.
              </p>
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

            {/* Show activity date for non-task events */}
            {formData.type !== 'task' && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Activity Date:</strong> When did this activity occur? This helps maintain an accurate timeline of past interactions.
                  </p>
                </div>

                <div>
                  <Label htmlFor="activityDate">Activity Date</Label>
                  <Input
                    id="activityDate"
                    type="datetime-local"
                    value={formData.activityDate}
                    onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to use the current date/time
                  </p>
                </div>
              </>
            )}

            {/* Only show due date and priority for tasks */}
            {formData.type === 'task' && (
              <>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Task Settings:</strong> Set a due date and priority for this task to track when it needs to be completed.
                  </p>
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
              </>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Link to Records (Optional)</h3>
              <p className="text-xs text-gray-500 mb-4">
                Link this activity to a company, contact, or deal. This helps track all interactions
                in one place and builds a complete activity timeline.
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyId">Company</Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    The company this activity is related to
                  </p>
                  <select
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value, personId: '', dealId: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {companies.map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.companyId && (
                  <>
                    <div>
                      <Label htmlFor="personId">Contact (Person)</Label>
                      <p className="text-xs text-gray-500 mt-1 mb-2">
                        The specific person at the company (optional)
                      </p>
                      <select
                        id="personId"
                        value={formData.personId}
                        onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={people.length === 0}
                      >
                        <option value="">None</option>
                        {people.map((person: any) => (
                          <option key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </option>
                        ))}
                      </select>
                      {people.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No contacts found for this company
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dealId">Deal (Optional)</Label>
                      <p className="text-xs text-gray-500 mt-1 mb-2">
                        If this activity is related to a specific sales opportunity, select the deal.
                        This helps track all deal-related activities in one timeline.
                      </p>
                      <select
                        id="dealId"
                        value={formData.dealId}
                        onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={deals.length === 0}
                      >
                        <option value="">None</option>
                        {deals.map((deal: any) => (
                          <option key={deal.id} value={deal.id}>
                            {deal.title} - {deal.stage}
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
              <Button type="submit" disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
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
