'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { logError } from '@/lib/logging';

interface SequenceDeleteButtonProps {
  sequenceId: string;
  sequenceName: string;
}

export function SequenceDeleteButton({ sequenceId, sequenceName }: SequenceDeleteButtonProps) {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Sequence deleted successfully');
      setShowConfirmDialog(false);
    },
    onError: (error: Error) => {
      logError('Error deleting sequence:', error);
      toast.error(error.message);
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    deleteMutation.mutate();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setShowConfirmDialog(true);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleButtonClick}
      >
        Delete
      </Button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowConfirmDialog(false)}
        >
          <Card
            className="w-full max-w-md p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Sequence?</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{sequenceName}</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Warning:</strong> This action cannot be undone. All enrollments and scheduled emails will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDialog(false);
                }}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
