'use client';

import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const BlocknoteViewer = dynamic(() => import('@/components/ui/blocknote-viewer'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-gray-500">Loading preview...</div>
});

interface EmailStep {
  id: string;
  stepOrder: number;
  subject: string;
  body: string;
  delayDays: number;
}

interface EmailStepsSectionProps {
  steps: EmailStep[];
}

export function EmailStepsSection({ steps }: EmailStepsSectionProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Email Steps</h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                  {step.stepOrder}
                </div>
                <div>
                  <h3 className="font-semibold">{step.subject}</h3>
                  <p className="text-sm text-gray-600">
                    {step.delayDays === 0 ? 'Sent immediately' : `Sent ${step.delayDays} days after ${index === 0 ? 'enrollment' : 'previous email'}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <BlocknoteViewer content={step.body} minHeight={150} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
