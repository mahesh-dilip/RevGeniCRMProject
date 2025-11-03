'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { logError } from '@/lib/logging';

interface DeleteSequenceButtonProps {
  sequenceId: string;
  sequenceName: string;
}

export function DeleteSequenceButton({ sequenceId, sequenceName }: DeleteSequenceButtonProps) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sequences/${sequenceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sequence');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Sequence deleted successfully');
      router.push('/sequences');
    },
    onError: (error: Error) => {
      logError('Error deleting sequence:', error);
      toast.error(error.message);
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
        onClick={() => setShowConfirmDialog(true)}
      >
        🗑️ Delete
      </Button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Sequence?</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{sequenceName}</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Warning:</strong> This action cannot be undone. All enrollments, scheduled emails,
                and sequence steps will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Sequence'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
