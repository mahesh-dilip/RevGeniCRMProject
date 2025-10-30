'use client';

import { DEAL_STAGES } from '@/lib/utils/constants';

interface DealStageProgressProps {
  currentStage: string;
}

export function DealStageProgress({ currentStage }: DealStageProgressProps) {
  const currentIndex = DEAL_STAGES.findIndex(s => s.value === currentStage);

  // Don't show for Won/Lost
  if (currentStage === 'Won' || currentStage === 'Lost') {
    return null;
  }

  const activeStages = DEAL_STAGES.filter(s => !['Won', 'Lost'].includes(s.value));
  const activeCurrentIndex = activeStages.findIndex(s => s.value === currentStage);

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Deal Progress</h3>
      <div className="relative">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          {activeStages.map((stage, index) => {
            const isCompleted = index < activeCurrentIndex;
            const isCurrent = index === activeCurrentIndex;

            return (
              <div key={stage.value} className="flex-1 flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                    'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                {/* Label */}
                <p className={`text-xs mt-2 text-center ${
                  isCurrent ? 'font-semibold text-gray-900' : 'text-gray-600'
                }`}>
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Connecting Lines */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" style={{ width: 'calc(100% - 2rem)', marginLeft: '1rem' }}>
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${(activeCurrentIndex / (activeStages.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
