
'use client';

import { logError } from '@/lib/logging';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';

interface SequenceStep {
  stepOrder: number;
  delayDays: number;
  subject: string;
  body: string;
}

export default function NewSequencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    pauseOnDealCreation: true,
    pauseOnDealStages: [] as string[],
  });

  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      stepOrder: 1,
      delayDays: 0,
      subject: '',
      body: '',
    },
  ]);

  const addStep = () => {
    const nextOrder = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepOrder: nextOrder,
        delayDays: nextOrder === 1 ? 0 : 3,
        subject: '',
        body: '',
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error('Sequence must have at least one step');
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.stepOrder = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate steps
      for (const step of steps) {
        if (!step.subject || !step.body) {
          throw new Error(`Step ${step.stepOrder} is missing subject or body`);
        }
      }

      const response = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create sequence');
      }

      const sequence = await response.json();
      toast.success(`Sequence "${sequence.name}" created successfully!`);
      router.push('/sequences');
    } catch (error) {
      logError('Error creating sequence:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create sequence');
    } finally {
      setLoading(false);
    }
  };

  const dealStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  const toggleDealStage = (stage: string) => {
    const newStages = formData.pauseOnDealStages.includes(stage)
      ? formData.pauseOnDealStages.filter(s => s !== stage)
      : [...formData.pauseOnDealStages, stage];
    setFormData({ ...formData, pauseOnDealStages: newStages });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Email Sequence</h1>
        <p className="text-gray-600 mt-1">
          Automate your email outreach with a multi-step sequence
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sequence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Sequence Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Series, Follow-up Campaign"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this sequence for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Active (sequence will run immediately)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="pauseOnDealCreation"
                checked={formData.pauseOnDealCreation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, pauseOnDealCreation: Boolean(checked) })
                }
              />
              <Label htmlFor="pauseOnDealCreation" className="cursor-pointer">
                Pause sequence when a deal is created
              </Label>
            </div>

            <div>
              <Label>Pause sequence when deal reaches these stages:</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {dealStages.map((stage) => (
                  <div key={stage} className="flex items-center gap-2">
                    <Checkbox
                      id={`stage-${stage}`}
                      checked={formData.pauseOnDealStages.includes(stage)}
                      onCheckedChange={() => toggleDealStage(stage)}
                    />
                    <Label htmlFor={`stage-${stage}`} className="cursor-pointer text-sm">
                      {stage}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Email Steps ({steps.length})</CardTitle>
              <Button type="button" onClick={addStep} size="sm" variant="outline">
                + Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="p-4 border rounded-md space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    Step {step.stepOrder}
                    {index === 0 && ' (Immediate)'}
                  </h3>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {index > 0 && (
                  <div>
                    <Label htmlFor={`delay-${index}`}>
                      Send {step.stepOrder > 1 ? 'after' : ''} (days)
                    </Label>
                    <Input
                      id={`delay-${index}`}
                      type="number"
                      min="1"
                      value={step.delayDays}
                      onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value))}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Days after {index === 1 ? 'enrollment' : `step ${step.stepOrder - 1}`}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor={`subject-${index}`}>Email Subject *</Label>
                  <Input
                    id={`subject-${index}`}
                    placeholder="e.g., Quick question about [Company]"
                    value={step.subject}
                    onChange={(e) => updateStep(index, 'subject', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`body-${index}`}>Email Body *</Label>
                  <RichTextEditor
                    value={step.body}
                    onChange={(value) => updateStep(index, 'body', value)}
                    placeholder="Hi {{firstName}},&#10;&#10;I noticed that..."
                    minHeight={250}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available variables: {'{{firstName}}, {{lastName}}, {{company}}, {{website}}'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use the formatting toolbar to add bold, italic, links, and lists to your email.
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Sequence'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sequences')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
