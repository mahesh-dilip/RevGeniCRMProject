'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Link from 'next/link';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    completed: boolean;
    priority?: string | null;
    dueDate?: Date | null;
    company?: { id: string; name: string } | null;
    deal?: { id: string; title: string } | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(task.completed);
  const [updating, setUpdating] = useState(false);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setUpdating(true);
    const newStatus = !completed;
    
    // Optimistic update
    setCompleted(newStatus);

    try {
      const response = await fetch(`/api/events/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      toast.success(newStatus ? 'Task completed!' : 'Task reopened');
      router.refresh();
    } catch (error) {
      // Revert optimistic update
      setCompleted(!newStatus);
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const navigateTo = task.deal 
    ? `/deals/${task.deal.id}` 
    : task.company 
    ? `/companies/${task.company.id}` 
    : `/events/${task.id}`;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !completed;

  return (
    <Link href={navigateTo}>
      <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isOverdue ? 'border-l-4 border-red-500' : ''
      }`}>
        <div className="flex items-start gap-3">
          <div onClick={handleToggleComplete}>
            <Checkbox
              checked={completed}
              disabled={updating}
              className="mt-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className={`font-semibold text-sm ${
                completed ? 'line-through text-gray-500' : ''
              }`}>
                {task.title}
              </h3>
              {task.priority && (
                <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {task.company && (
                <p className="text-xs text-gray-600 truncate">
                  🏢 {task.company.name}
                </p>
              )}
              {task.deal && (
                <p className="text-xs text-gray-600 truncate">
                  💼 {task.deal.title}
                </p>
              )}
              {task.dueDate && (
                <p className={`text-xs ${
                  isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                }`}>
                  {isOverdue ? '⚠️ Overdue: ' : '📅 Due: '}
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

