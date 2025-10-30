'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface QualifyLeadModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
}

export function QualifyLeadModal({ companyId, companyName, onClose }: QualifyLeadModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'qualify' | 'disqualify' | null>(null);
  const [formData, setFormData] = useState({
    leadScore: 70,
    notes: '',
    followUpDate: ''
  });

  const handleQualify = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Qualified',
          leadScore: formData.leadScore
        })
      });

      if (!response.ok) {
        throw new Error('Failed to qualify lead');
      }

      toast.success(`${companyName} qualified successfully!`);
      
      // Ask if they want to create a deal
      const createDeal = confirm('Would you like to create a deal for this qualified lead?');
      
      if (createDeal) {
        router.push(`/deals/new?companyId=${companyId}`);
      } else {
        router.refresh();
        onClose();
      }
    } catch (error) {
      console.error('Error qualifying lead:', error);
      toast.error('Failed to qualify lead');
    } finally {
      setLoading(false);
    }
  };

  const handleDisqualify = async () => {
    if (!formData.notes.trim()) {
      toast.error('Please provide a reason for disqualification');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Lost',
          leadScore: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to disqualify lead');
      }

      toast.success(`${companyName} marked as disqualified`);
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error disqualifying lead:', error);
      toast.error('Failed to disqualify lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">Qualify Lead</h2>
        <p className="text-gray-600 mb-6">
          Assess <strong>{companyName}</strong> to determine if they're ready for sales outreach.
        </p>

        {!action ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="leadScore">Lead Score (1-100)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="leadScore"
                  type="range"
                  min="1"
                  max="100"
                  value={formData.leadScore}
                  onChange={(e) => setFormData({ ...formData, leadScore: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="font-bold text-2xl w-16 text-right">
                  {formData.leadScore}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.leadScore >= 80 && '🔥 Hot lead - High priority'}
                {formData.leadScore >= 60 && formData.leadScore < 80 && '👍 Warm lead - Good fit'}
                {formData.leadScore >= 40 && formData.leadScore < 60 && '👌 Moderate lead - Worth pursuing'}
                {formData.leadScore < 40 && '❄️ Cold lead - May need nurturing'}
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Why is this lead qualified? Key insights, decision makers, pain points..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="followUpDate">Follow-up Date (Optional)</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setAction('qualify')}
              >
                ✓ Qualify Lead
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setAction('disqualify')}
              >
                ✗ Disqualify
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        ) : action === 'qualify' ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">✓</div>
            <h3 className="text-xl font-semibold">Qualify this lead?</h3>
            <p className="text-gray-600">
              This will change the status to <strong>Qualified</strong> and set the lead score to <strong>{formData.leadScore}</strong>.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAction(null)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleQualify}
                disabled={loading}
              >
                {loading ? 'Qualifying...' : 'Confirm Qualification'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-6xl">❌</div>
            <h3 className="text-xl font-semibold text-center">Disqualify this lead?</h3>
            <p className="text-gray-600 text-center">
              This will mark <strong>{companyName}</strong> as <strong>Lost</strong>.
            </p>
            <div>
              <Label htmlFor="disqualifyReason">Reason for Disqualification *</Label>
              <Textarea
                id="disqualifyReason"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Wrong industry, budget too small, not a decision maker..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAction(null)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDisqualify}
                disabled={loading || !formData.notes.trim()}
              >
                {loading ? 'Disqualifying...' : 'Confirm Disqualification'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

