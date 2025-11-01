'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { logError } from '@/lib/logging';

export default function NewOutreachProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyOffering: '',
    valueProposition: '',
    targetPainPoints: [''],
    keyDifferentiators: [''],
    successStories: [''],
    tone: 'professional',
    ctaPreference: '',
    isDefault: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/outreach-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-profiles'] });
      toast.success('Profile created successfully!');
      router.push('/outreach-profiles');
    },
    onError: (error: Error) => {
      logError('Create profile error:', error);
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty strings from arrays
    const cleanedData = {
      ...formData,
      targetPainPoints: formData.targetPainPoints.filter(p => p.trim() !== ''),
      keyDifferentiators: formData.keyDifferentiators.filter(d => d.trim() !== ''),
      successStories: formData.successStories.filter(s => s.trim() !== ''),
    };

    createMutation.mutate(cleanedData);
  };

  const addArrayItem = (field: 'targetPainPoints' | 'keyDifferentiators' | 'successStories') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const removeArrayItem = (
    field: 'targetPainPoints' | 'keyDifferentiators' | 'successStories',
    index: number
  ) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const updateArrayItem = (
    field: 'targetPainPoints' | 'keyDifferentiators' | 'successStories',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Outreach Profile</h1>
        <p className="text-gray-600">
          Set up your business context for AI-powered email generation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Profile Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., SaaS Product Sales, Consulting Services"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                A descriptive name for this profile
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of when to use this profile"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked as boolean })
                }
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default profile
              </Label>
            </div>
          </div>
        </Card>

        {/* Company Offering */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">What You Offer</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="companyOffering">Company/Product Offering *</Label>
              <Textarea
                id="companyOffering"
                value={formData.companyOffering}
                onChange={(e) => setFormData({ ...formData, companyOffering: e.target.value })}
                placeholder="e.g., We provide an AI-powered CRM platform for B2B sales teams"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Brief description of your company, product, or service
              </p>
            </div>

            <div>
              <Label htmlFor="valueProposition">Value Proposition *</Label>
              <Textarea
                id="valueProposition"
                value={formData.valueProposition}
                onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
                placeholder="e.g., Help sales teams close deals 30% faster through intelligent automation and insights"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The main benefit or outcome you deliver to customers
              </p>
            </div>
          </div>
        </Card>

        {/* Pain Points */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Target Pain Points</h2>
          <p className="text-sm text-gray-600 mb-4">
            What problems does your offering solve? AI will use these to personalize emails.
          </p>

          <div className="space-y-3">
            {formData.targetPainPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={point}
                  onChange={(e) => updateArrayItem('targetPainPoints', index, e.target.value)}
                  placeholder="e.g., Manual data entry wastes valuable selling time"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeArrayItem('targetPainPoints', index)}
                  disabled={formData.targetPainPoints.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('targetPainPoints')}
            >
              + Add Pain Point
            </Button>
          </div>
        </Card>

        {/* Differentiators */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Key Differentiators</h2>
          <p className="text-sm text-gray-600 mb-4">
            What makes you different from competitors?
          </p>

          <div className="space-y-3">
            {formData.keyDifferentiators.map((diff, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={diff}
                  onChange={(e) => updateArrayItem('keyDifferentiators', index, e.target.value)}
                  placeholder="e.g., AI-powered lead scoring with 95% accuracy"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeArrayItem('keyDifferentiators', index)}
                  disabled={formData.keyDifferentiators.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('keyDifferentiators')}
            >
              + Add Differentiator
            </Button>
          </div>
        </Card>

        {/* Success Stories */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Success Stories</h2>
          <p className="text-sm text-gray-600 mb-4">
            Real results or case studies AI can reference in emails
          </p>

          <div className="space-y-3">
            {formData.successStories.map((story, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={story}
                  onChange={(e) => updateArrayItem('successStories', index, e.target.value)}
                  placeholder="e.g., Helped TechCorp increase win rate by 40% in 6 months"
                  rows={2}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeArrayItem('successStories', index)}
                  disabled={formData.successStories.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem('successStories')}
            >
              + Add Success Story
            </Button>
          </div>
        </Card>

        {/* Tone & CTA */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Communication Style</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tone">Tone *</Label>
              <select
                id="tone"
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                className="w-full border rounded p-2"
                required
              >
                <option value="professional">Professional</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The writing style AI should use in emails
              </p>
            </div>

            <div>
              <Label htmlFor="ctaPreference">Call-to-Action Preference *</Label>
              <Input
                id="ctaPreference"
                value={formData.ctaPreference}
                onChange={(e) => setFormData({ ...formData, ctaPreference: e.target.value })}
                placeholder="e.g., Schedule a 15-minute demo call"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your preferred way to ask prospects to take the next step
              </p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
