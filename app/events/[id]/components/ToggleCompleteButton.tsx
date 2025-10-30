'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ToggleCompleteButtonProps {
  eventId: string;
  completed: boolean;
}

export function ToggleCompleteButton({ eventId, completed }: ToggleCompleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      toast.success(completed ? 'Event marked as incomplete' : 'Event marked as complete');
      router.refresh();
    } catch (error) {
      console.error('Error toggling event:', error);
      toast.error('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={completed ? 'outline' : 'default'}
    >
      {loading ? '...' : completed ? '↩ Mark Incomplete' : '✓ Mark Complete'}
    </Button>
  );
}
