'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { EnrollmentCard } from './EnrollmentCard';
import { Button } from '@/components/ui/button';

interface EnrollmentsSectionProps {
  initialEnrollments: any[];
}

export function EnrollmentsSection({ initialEnrollments }: EnrollmentsSectionProps) {
  const [enrollments, setEnrollments] = useState(initialEnrollments);

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const pausedEnrollments = enrollments.filter(e => e.status === 'paused');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');

  const handleUpdate = () => {
    // Trigger a page refresh to get updated data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Active Enrollments */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Active Enrollments ({activeEnrollments.length})
        </h2>
        <div className="space-y-3">
          {activeEnrollments.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              onUpdate={handleUpdate}
            />
          ))}
          {activeEnrollments.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No active enrollments</p>
          )}
        </div>
      </Card>

      {/* Paused Enrollments */}
      {pausedEnrollments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Paused Enrollments ({pausedEnrollments.length})
          </h2>
          <div className="space-y-3">
            {pausedEnrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Completed Enrollments */}
      {completedEnrollments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Completed Enrollments ({completedEnrollments.length})
          </h2>
          <div className="space-y-3">
            {completedEnrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
