'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { logError } from '@/lib/logging';

interface EnrollmentCardProps {
  enrollment: any;
  onUpdate?: () => void;
}

export function EnrollmentCard({ enrollment, onUpdate }: EnrollmentCardProps) {
  const queryClient = useQueryClient();
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({ status, pauseReason }: { status: string; pauseReason?: string }) => {
      const response = await fetch(`/api/sequences/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, pauseReason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update enrollment');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence'] });
      onUpdate?.();
      setShowPauseModal(false);
      setPauseReason('');
      toast.success('Enrollment updated successfully');
    },
    onError: (error: Error) => {
      logError('Error updating enrollment:', error);
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sequences/enrollments/${enrollment.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unenroll company');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence'] });
      onUpdate?.();
      toast.success('Company unenrolled successfully');
    },
    onError: (error: Error) => {
      logError('Error unenrolling company:', error);
      toast.error(error.message);
    }
  });

  const handlePause = () => {
    if (!pauseReason.trim()) {
      toast.error('Please provide a reason for pausing');
      return;
    }
    updateMutation.mutate({ status: 'paused', pauseReason });
  };

  const handleResume = () => {
    updateMutation.mutate({ status: 'active' });
  };

  const handleUnenroll = () => {
    if (confirm(`Are you sure you want to unenroll ${enrollment.company.name} from this sequence?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link
            href={`/companies/${enrollment.company.id}`}
            className="font-medium hover:text-blue-600 text-lg"
          >
            {enrollment.company.name}
          </Link>
          <Badge variant={
            enrollment.status === 'active' ? 'default' :
            enrollment.status === 'paused' ? 'secondary' :
            'outline'
          }>
            {enrollment.status === 'active' && `Step ${enrollment.currentStep}`}
            {enrollment.status === 'paused' && 'Paused'}
            {enrollment.status === 'completed' && 'Completed'}
            {enrollment.status === 'cancelled' && 'Cancelled'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Enrolled {formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}
        </p>

        {enrollment.pauseReason && (
          <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded mb-2">
            <strong>Paused:</strong> {enrollment.pauseReason}
          </p>
        )}

        {enrollment.scheduledEmails && enrollment.scheduledEmails.length > 0 && (() => {
          // Find the next scheduled email that's actually in the future and has status 'scheduled'
          const nextEmail = enrollment.scheduledEmails.find((email: any) =>
            email.status === 'scheduled' && new Date(email.scheduledFor) > new Date()
          );

          if (nextEmail) {
            return (
              <div className="text-sm text-blue-600 mb-3 bg-blue-50 p-2 rounded">
                <strong>Next email:</strong> {formatDistanceToNow(new Date(nextEmail.scheduledFor), { addSuffix: true })}
              </div>
            );
          }
          return null;
        })()}

        <div className="flex gap-2 flex-wrap">
          {enrollment.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPauseModal(true)}
              disabled={updateMutation.isPending}
            >
              ⏸ Pause
            </Button>
          )}

          {enrollment.status === 'paused' && (
            <Button
              size="sm"
              variant="default"
              onClick={handleResume}
              disabled={updateMutation.isPending}
            >
              ▶ Resume
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            {showTimeline ? '📅 Hide' : '📅 Timeline'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleUnenroll}
            disabled={deleteMutation.isPending}
          >
            ✕ Unenroll
          </Button>
        </div>

        {/* Timeline View */}
        {showTimeline && enrollment.scheduledEmails && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">Email Timeline</h4>
            <div className="space-y-2">
              {enrollment.scheduledEmails.map((email: any, index: number) => (
                <div
                  key={email.id}
                  className={`text-sm p-3 rounded border-l-4 ${
                    email.sent
                      ? 'border-green-500 bg-green-50'
                      : email.cancelled
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{email.subject}</span>
                    <Badge
                      variant={email.sent ? 'default' : email.cancelled ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {email.sent ? '✓ Sent' : email.cancelled ? 'Cancelled' : 'Scheduled'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    {email.sent
                      ? `Sent ${formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}`
                      : email.cancelled
                      ? 'Cancelled'
                      : `Scheduled for ${formatDistanceToNow(new Date(email.scheduledFor), { addSuffix: true })}`
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Pause Enrollment</h2>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for pausing this enrollment. All scheduled emails will be cancelled.
            </p>
            <div className="space-y-4">
              <Textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g., Prospect requested to pause outreach, Company in evaluation phase, etc."
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPauseModal(false);
                    setPauseReason('');
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePause}
                  disabled={updateMutation.isPending || !pauseReason.trim()}
                >
                  {updateMutation.isPending ? 'Pausing...' : 'Pause Enrollment'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
