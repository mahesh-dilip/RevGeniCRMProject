
'use client';

import { logError } from '@/lib/logging';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function NewCompanyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    geography: '',
    description: '',
    foundedYear: ''
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      return response.json();
    },
    onSuccess: (company) => {
      // Invalidate and refetch companies list
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`${company.name} added successfully!`);
      router.push('/companies');
    },
    onError: (error: Error) => {
      logError('Error creating company:', error);
      toast.error(error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createCompanyMutation.mutate({
      ...formData,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
      sourceType: 'manual',
      status: 'Lead'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Company</h1>
        <p className="text-gray-600 mt-1">Create a new company in your CRM</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corporation"
                required
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., SaaS, FinTech, E-commerce"
                />
              </div>

              <div>
                <Label htmlFor="size">Company Size</Label>
                <select
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size...</option>
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="11-50 employees">11-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-500 employees">201-500 employees</option>
                  <option value="501-1000 employees">501-1000 employees</option>
                  <option value="1001-5000 employees">1001-5000 employees</option>
                  <option value="5000+ employees">5000+ employees</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="geography">Location</Label>
                <Input
                  id="geography"
                  value={formData.geography}
                  onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div>
                <Label htmlFor="foundedYear">Founded Year</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                  placeholder="e.g., 2020"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the company and what they do..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createCompanyMutation.isPending}>
            {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </form>
    </div>
  );
}

