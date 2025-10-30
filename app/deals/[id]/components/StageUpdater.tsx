'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DEAL_STAGES } from '@/lib/utils/constants';

interface StageUpdaterProps {
  dealId: string;
  currentStage: string;
}

export function StageUpdater({ dealId, currentStage }: StageUpdaterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showWonModal, setShowWonModal] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const handleStageChange = async (newStage: string) => {
    // Show modal for Lost stage
    if (newStage === 'Lost') {
      setShowLostModal(true);
      return;
    }

    // Show confirmation for Won stage
    if (newStage === 'Won') {
      setShowWonModal(true);
      return;
    }

    await updateStage(newStage);
  };

  const updateStage = async (newStage: string, lostReasonText?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/update-stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          lostReason: lostReasonText || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      if (newStage === 'Won') {
        toast.success('🎉 Congratulations! Deal marked as Won!', {
          duration: 5000
        });
      } else {
        toast.success(`Deal moved to ${newStage}`);
      }

      setShowLostModal(false);
      setShowWonModal(false);
      setLostReason('');
      router.refresh();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Failed to update deal stage');
    } finally {
      setLoading(false);
    }
  };

  const handleLostConfirm = () => {
    if (!lostReason.trim()) {
      toast.error('Please provide a reason for marking this deal as lost');
      return;
    }
    updateStage('Lost', lostReason);
  };

  const handleWonConfirm = () => {
    updateStage('Won');
  };

  // Don't show stage updater if already Won or Lost
  if (currentStage === 'Won' || currentStage === 'Lost') {
    return null;
  }

  const activeStages = DEAL_STAGES.filter(
    s => !['Won', 'Lost'].includes(s.value)
  );

  return (
    <>
      <Card className="p-4">
        <Label className="text-sm font-semibold mb-3 block">
          Update Deal Stage:
        </Label>
        <div className="flex flex-wrap gap-2">
          {activeStages.map(stage => (
            <Button
              key={stage.value}
              variant={currentStage === stage.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStageChange(stage.value)}
              disabled={loading || currentStage === stage.value}
            >
              {stage.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowWonModal(true)}
            disabled={loading}
          >
            ✓ Mark as Won
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowLostModal(true)}
            disabled={loading}
          >
            ✗ Mark as Lost
          </Button>
        </div>
      </Card>

      {/* Lost Reason Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Mark Deal as Lost</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason why this deal was lost. This helps improve future deals.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lostReason">Reason for Loss *</Label>
                <Textarea
                  id="lostReason"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="e.g., Chose competitor, Budget constraints, Timing not right..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLostModal(false);
                    setLostReason('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLostConfirm}
                  disabled={loading || !lostReason.trim()}
                >
                  {loading ? 'Updating...' : 'Mark as Lost'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Won Confirmation Modal */}
      {showWonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Mark Deal as Won?</h2>
              <p className="text-gray-600 mb-6">
                Congratulations! This will mark the deal as successfully closed and update the company status to Customer.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowWonModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleWonConfirm}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : '✓ Yes, Mark as Won!'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

