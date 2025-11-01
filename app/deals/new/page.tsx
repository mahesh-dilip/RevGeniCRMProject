
'use client';

import { logError } from '@/lib/logging';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { DEAL_STAGES } from '@/lib/utils/constants';
import { InlinePersonForm } from '@/components/people/InlinePersonForm';

function NewDealForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedCompanyPeople, setSelectedCompanyPeople] = useState<any[]>([]);
  const [showInlinePersonForm, setShowInlinePersonForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: 'Prospecting',
    probability: 50,
    closeDate: '',
    description: '',
    nextAction: '',
    companyId: searchParams?.get('companyId') || '',
    primaryContactId: ''
  });

  // Fetch companies and people with React Query
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to load companies');
      return response.json();
    },
  });

  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const response = await fetch('/api/people');
      if (!response.ok) throw new Error('Failed to load people');
      return response.json();
    },
  });

  useEffect(() => {
    if (formData.companyId) {
      const filtered = people.filter((p: any) => p.companyId === formData.companyId);
      setSelectedCompanyPeople(filtered);

      // Auto-generate title if company is selected
      const company = companies.find((c: any) => c.id === formData.companyId);
      if (company && !formData.title) {
        setFormData(prev => ({
          ...prev,
          title: `${company.name} - ${new Date().getFullYear()} Deal`
        }));
      }
    } else {
      setSelectedCompanyPeople([]);
    }
  }, [formData.companyId, people, companies]);

  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deal');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate deals and companies queries (to update counts)
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      toast.success('Deal created successfully!');
      router.push('/deals');
    },
    onError: (error: Error) => {
      logError('Create deal error:', error);
      toast.error(error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createDealMutation.mutate({
      ...formData,
      value: formData.value ? parseFloat(formData.value) : null,
      closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString() : null,
      primaryContactId: formData.primaryContactId || null
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Deal</h1>
        <p className="text-gray-600">Add a sales opportunity to your pipeline</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="companyId">Company *</Label>
              <select
                id="companyId"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value, primaryContactId: '' })}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Which company is this deal with?
              </p>
            </div>

            {formData.companyId && (
              <div>
                <Label htmlFor="primaryContactId">Primary Contact</Label>
                <div className="flex gap-2">
                  <select
                    id="primaryContactId"
                    value={formData.primaryContactId}
                    onChange={(e) => setFormData({ ...formData, primaryContactId: e.target.value })}
                    className="flex-1 border rounded p-2"
                  >
                    <option value="">Select primary contact...</option>
                    {selectedCompanyPeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName} {person.title ? `- ${person.title}` : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInlinePersonForm(true)}
                  >
                    + New Contact
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Who is the main decision maker or point of contact?
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="title">Deal Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Acme Corp - Q1 2025 Enterprise Deal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Deal Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div>
                <Label htmlFor="closeDate">Expected Close Date</Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details about this opportunity..."
                rows={4}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Pipeline & Stage</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="stage">Deal Stage *</Label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full border rounded p-2"
                required
              >
                {DEAL_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="probability">Win Probability (%)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="probability"
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="font-semibold w-12 text-right">{formData.probability}%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="nextAction">Next Action</Label>
              <Input
                id="nextAction"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                placeholder="e.g., Schedule demo call, Send proposal, Follow up..."
              />
              <p className="text-xs text-gray-500 mt-1">
                What's the next step to move this deal forward?
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createDealMutation.isPending}>
            {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>

      {showInlinePersonForm && formData.companyId && (
        <InlinePersonForm
          companyId={formData.companyId}
          onPersonCreated={(newPerson) => {
            // Invalidate people query to refetch with new person
            queryClient.invalidateQueries({ queryKey: ['people'] });
            setFormData({ ...formData, primaryContactId: newPerson.id });
            setShowInlinePersonForm(false);
          }}
          onCancel={() => setShowInlinePersonForm(false)}
        />
      )}
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-12 text-center">Loading...</div>}>
      <NewDealForm />
    </Suspense>
  );
}
