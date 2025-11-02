'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface AILoadingProps {
  message?: string;
  estimatedSeconds?: number;
  showProgress?: boolean;
}

export function AILoading({
  message = 'AI is generating your content...',
  estimatedSeconds = 15,
  showProgress = true,
}: AILoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing your requirements',
    'Gathering context',
    'Generating personalized content',
    'Finalizing results',
  ];

  useEffect(() => {
    if (!showProgress) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Progress slows down as it approaches 100%
        const increment = (100 - prev) * 0.05;
        return Math.min(prev + increment, 95);
      });
    }, 500);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, estimatedSeconds * 250); // Cycle through steps

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [estimatedSeconds, showProgress, steps.length]);

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* AI Animation */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-0 left-1/2 transform -translate-x-1/2" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
          {showProgress && (
            <p className="text-sm text-gray-600 animate-fade-in">
              {steps[currentStep]}...
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full max-w-md space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              This usually takes {estimatedSeconds} seconds
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 max-w-md">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Our AI is analyzing your
            business context to create highly personalized content. The wait will be worth
            it!
          </p>
        </div>
      </div>
    </Card>
  );
}

export function SimpleAISpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
