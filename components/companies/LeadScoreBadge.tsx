'use client';

interface LeadScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadScoreBadge({ score, size = 'md' }: LeadScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <div className="text-gray-400 text-sm">
        No score
      </div>
    );
  }

  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'Hot Lead';
    if (score >= 60) return 'Warm Lead';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Cool';
    return 'Cold';
  };

  const sizeClasses = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-20 h-20 text-base',
    lg: 'w-24 h-24 text-lg'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]} rounded-full ${getColor(score)} flex items-center justify-center text-white font-bold shadow-lg`}>
        {score}
      </div>
      <p className="text-xs font-medium text-gray-600">{getLabel(score)}</p>
    </div>
  );
}
