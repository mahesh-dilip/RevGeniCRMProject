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

  // Calculate task urgency
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueDateOnly = dueDate ? new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()) : null;

  const isOverdue = dueDateOnly && dueDateOnly < today && !completed;
  const isDueToday = dueDateOnly && dueDateOnly.getTime() === today.getTime() && !completed;
  const isDueSoon = dueDateOnly && dueDateOnly > today && dueDateOnly <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) && !completed;

  // Determine card styling based on urgency
  let cardStyle = '';
  let dateStyle = 'text-gray-500';
  let datePrefix = '📅 Due: ';

  if (isOverdue) {
    cardStyle = 'border-l-4 border-red-500 bg-red-50';
    dateStyle = 'text-red-700 font-semibold';
    datePrefix = '⚠️ Overdue: ';
  } else if (isDueToday) {
    cardStyle = 'border-l-4 border-amber-500 bg-amber-50';
    dateStyle = 'text-amber-700 font-semibold';
    datePrefix = '🔔 Due Today: ';
  } else if (isDueSoon) {
    cardStyle = 'border-l-4 border-blue-400 bg-blue-50';
    dateStyle = 'text-blue-700';
    datePrefix = '📌 Due Soon: ';
  }

  return (
    <Link href={navigateTo}>
      <Card className={`p-4 hover:shadow-md transition-all cursor-pointer ${cardStyle}`}>
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
                <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                  task.priority === 'high' ? 'bg-rose-600 text-white' :
                  task.priority === 'medium' ? 'bg-orange-500 text-white' :
                  'bg-slate-500 text-white'
                }`}>
                  {task.priority === 'high' ? '🔴 ' : task.priority === 'medium' ? '🟠 ' : '⚪ '}
                  {task.priority.toUpperCase()}
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
                <p className={`text-xs ${dateStyle}`}>
                  {datePrefix}
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

