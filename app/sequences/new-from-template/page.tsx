'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { logError } from '@/lib/logging';
import { AILoading } from '@/components/ui/ai-loading';
import { AIOperationErrorBoundary } from '@/components/ai-error-boundary';

type Step = 'template' | 'profile' | 'preview' | 'edit' | 'saving';

export default function NewSequenceFromTemplatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [sampleCompanyId, setSelectedSampleCompanyId] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceDescription, setSequenceDescription] = useState('');
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [editableEmails, setEditableEmails] = useState<any[]>([]);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['sequence-templates'],
    queryFn: async () => {
      const response = await fetch('/api/sequence-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['outreach-profiles'],
    queryFn: async () => {
      const response = await fetch('/api/outreach-profiles');
      if (!response.ok) throw new Error('Failed to fetch profiles');
      return response.json();
    },
  });

  // Fetch companies for sample selection
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
  });

  // Generate preview mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          profileId: selectedProfileId,
          companyId: sampleCompanyId,
          customInstructions: customInstructions || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate sequence');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedEmails(data.emails);
      setEditableEmails(data.emails.map((e: any) => ({ ...e })));

      // Auto-generate sequence name from template
      const template = templates.find((t: any) => t.id === selectedTemplateId);
      const company = companies.find((c: any) => c.id === sampleCompanyId);
      setSequenceName(`${template?.name} - ${company?.name || 'Generated'}`);

      setCurrentStep('edit');
      toast.success('Sequence generated successfully!');
    },
    onError: (error: Error) => {
      logError('Generate sequence error:', error);
      toast.error(error.message);
    },
  });

  // Save sequence mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const template = templates.find((t: any) => t.id === selectedTemplateId);

      const response = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sequenceName,
          description: sequenceDescription,
          active: true,
          pauseOnDealCreation: true,
          pauseOnDealStages: ['Won', 'Lost'],
          steps: editableEmails.map((email, index) => ({
            stepOrder: index + 1,
            delayDays: template.emails[index].delayDays,
            subject: email.subject,
            body: email.body,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sequence');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Sequence created successfully!');
      router.push('/sequences');
    },
    onError: (error: Error) => {
      logError('Save sequence error:', error);
      toast.error(error.message);
    },
  });

  const handleNext = () => {
    if (currentStep === 'template' && !selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }
    if (currentStep === 'profile' && !selectedProfileId) {
      toast.error('Please select a profile');
      return;
    }
    if (currentStep === 'preview' && !sampleCompanyId) {
      toast.error('Please select a sample company');
      return;
    }

    if (currentStep === 'template') {
      setCurrentStep('profile');
    } else if (currentStep === 'profile') {
      setCurrentStep('preview');
    } else if (currentStep === 'preview') {
      generateMutation.mutate();
    }
  };

  const handleSave = () => {
    if (!sequenceName.trim()) {
      toast.error('Please enter a sequence name');
      return;
    }
    saveMutation.mutate();
  };

  const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId);

  return (
    <AIOperationErrorBoundary>
      <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Sequence with AI</h1>
        <p className="text-gray-600">Let AI generate personalized email sequences for you</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { id: 'template', label: '1. Template' },
          { id: 'profile', label: '2. Profile' },
          { id: 'preview', label: '3. Preview' },
          { id: 'edit', label: '4. Edit & Save' },
        ].map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={`flex-1 h-2 rounded ${
                currentStep === step.id
                  ? 'bg-blue-500'
                  : index < ['template', 'profile', 'preview', 'edit'].indexOf(currentStep)
                  ? 'bg-blue-300'
                  : 'bg-gray-200'
              }`}
            />
            <span
              className={`ml-2 text-sm ${
                currentStep === step.id ? 'font-semibold text-blue-600' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Template */}
      {currentStep === 'template' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template: any) => (
              <Card
                key={template.id}
                className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedTemplateId === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <h3 className="text-lg font-bold mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{template.emailCount} emails</Badge>
                  <Badge variant="outline">
                    {template.emails[template.emails.length - 1].delayDays} day sequence
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Profile */}
      {currentStep === 'profile' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select Outreach Profile</h2>
            <Link href="/outreach-profiles/new" target="_blank">
              <Button variant="outline" size="sm">
                + Create New Profile
              </Button>
            </Link>
          </div>

          {profiles.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-4">No outreach profiles yet.</p>
              <Link href="/outreach-profiles/new">
                <Button>Create Your First Profile</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile: any) => (
                <Card
                  key={profile.id}
                  className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedProfileId === profile.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">{profile.name}</h3>
                    {profile.isDefault && <Badge variant="default">Default</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{profile.companyOffering}</p>
                  <Badge variant="outline">{profile.tone}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Sample Company */}
      {currentStep === 'preview' && (
        <>
          {generateMutation.isPending ? (
            <AILoading
              message="🤖 AI is crafting personalized emails..."
              estimatedSeconds={15}
              showProgress={true}
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Select Sample Company for Preview</h2>
              <p className="text-sm text-gray-600">
                Choose a company from your CRM to see how AI will personalize emails. This helps you review
                the quality before saving the sequence.
              </p>

              <div>
                <Label htmlFor="sampleCompany">Sample Company *</Label>
                <select
                  id="sampleCompany"
                  value={sampleCompanyId}
                  onChange={(e) => setSelectedSampleCompanyId(e.target.value)}
                  className="w-full border rounded p-2 mb-4"
                >
                  <option value="">Select a company...</option>
                  {companies.slice(0, 20).map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name} {company.industry ? `- ${company.industry}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add any specific instructions for AI generation (e.g., 'Focus on cost savings' or 'Mention upcoming webinar')"
                  rows={3}
                />
              </div>

              {selectedTemplate && (
                <Card className="p-4 bg-gray-50">
                  <h3 className="font-semibold mb-2">Sequence Structure:</h3>
                  <ul className="space-y-2">
                    {selectedTemplate.emails.map((email: any, index: number) => (
                      <li key={index} className="text-sm">
                        <span className="font-medium">Email {email.stepNumber}</span>
                        {' '}(Day {email.delayDays}): {email.purpose}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Step 4: Edit Generated Emails */}
      {currentStep === 'edit' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Review & Edit Generated Sequence</h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="sequenceName">Sequence Name *</Label>
                <Input
                  id="sequenceName"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  placeholder="e.g., Cold Outreach - Q1 2024"
                />
              </div>

              <div>
                <Label htmlFor="sequenceDescription">Description</Label>
                <Textarea
                  id="sequenceDescription"
                  value={sequenceDescription}
                  onChange={(e) => setSequenceDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {editableEmails.map((email, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">
                    Email {index + 1}
                    {selectedTemplate && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Day {selectedTemplate.emails[index].delayDays})
                      </span>
                    )}
                  </h3>
                  {email.reasoning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.info(email.reasoning, { duration: 5000 });
                      }}
                    >
                      View AI Reasoning
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={email.subject}
                      onChange={(e) => {
                        const newEmails = [...editableEmails];
                        newEmails[index].subject = e.target.value;
                        setEditableEmails(newEmails);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Email Body</Label>
                    <Textarea
                      value={email.body}
                      onChange={(e) => {
                        const newEmails = [...editableEmails];
                        newEmails[index].body = e.target.value;
                        setEditableEmails(newEmails);
                      }}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep === 'template') {
              router.back();
            } else if (currentStep === 'profile') {
              setCurrentStep('template');
            } else if (currentStep === 'preview') {
              setCurrentStep('profile');
            } else if (currentStep === 'edit') {
              setCurrentStep('preview');
            }
          }}
        >
          {currentStep === 'template' ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex gap-2">
          {currentStep !== 'edit' && (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 'template' && !selectedTemplateId) ||
                (currentStep === 'profile' && !selectedProfileId) ||
                (currentStep === 'preview' && !sampleCompanyId) ||
                generateMutation.isPending
              }
            >
              {generateMutation.isPending ? 'Generating...' : 'Next'}
            </Button>
          )}

          {currentStep === 'edit' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  generateMutation.mutate();
                }}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save Sequence'}
              </Button>
            </>
          )}
        </div>
      </div>
      </div>
    </AIOperationErrorBoundary>
  );
}
