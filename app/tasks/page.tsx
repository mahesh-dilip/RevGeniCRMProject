
'use client';

import { logError } from '@/lib/logging';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Fetch tasks with React Query
  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/events?type=task');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });

  // Mutation for toggling task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const response = await fetch(`/api/events/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      return response.json();
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(completed ? 'Task marked as incomplete' : 'Task completed!');
    },
    onError: (error) => {
      logError('Error toggling task:', error);
      toast.error('Failed to update task');
    },
  });

  const handleToggleComplete = (taskId: string, currentStatus: boolean) => {
    toggleTaskMutation.mutate({ taskId, completed: currentStatus });
  };

  const filteredTasks = tasks.filter((task: any) => {
    if (statusFilter === 'pending') return !task.completed;
    if (statusFilter === 'completed') return task.completed;
    return true;
  });

  const now = startOfDay(new Date());
  const overdueTasks = filteredTasks.filter((t: any) =>
    !t.completed && t.dueDate && isBefore(new Date(t.dueDate), now)
  );
  const todayTasks = filteredTasks.filter((t: any) =>
    !t.completed && t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
  );
  const upcomingTasks = filteredTasks.filter((t: any) =>
    !t.completed && t.dueDate && isAfter(new Date(t.dueDate), now) && format(new Date(t.dueDate), 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd')
  );
  const noDueDateTasks = filteredTasks.filter((t: any) => !t.completed && !t.dueDate);
  const completedTasks = filteredTasks.filter((t: any) => t.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600">
            {overdueTasks.length} overdue • {todayTasks.length} due today • {upcomingTasks.length} upcoming
          </p>
        </div>
        <Link href="/tasks/new">
          <Button>+ Create Task</Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Tasks</h3>
            <p className="text-sm text-blue-800">
              Tasks are action items you need to complete. They always have due dates and can be marked as complete.
              For logging past activities like calls or emails, use the <Link href="/activities" className="underline">Activities page</Link> instead.
            </p>
          </div>
        </div>
      </Card>

      {/* Status Filter */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pending ({tasks.filter((t: any) => !t.completed).length})
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Completed ({tasks.filter((t: any) => t.completed).length})
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All ({tasks.length})
        </Button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading tasks...</div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Overdue Tasks */}
          {statusFilter !== 'completed' && overdueTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 text-red-600">⚠️ Overdue ({overdueTasks.length})</h2>
              <div className="space-y-2">
                {overdueTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} isOverdue />
                ))}
              </div>
            </div>
          )}

          {/* Today Tasks */}
          {statusFilter !== 'completed' && todayTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">📅 Due Today ({todayTasks.length})</h2>
              <div className="space-y-2">
                {todayTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {statusFilter !== 'completed' && upcomingTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">🔜 Upcoming ({upcomingTasks.length})</h2>
              <div className="space-y-2">
                {upcomingTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} />
                ))}
              </div>
            </div>
          )}

          {/* No Due Date Tasks */}
          {statusFilter !== 'completed' && noDueDateTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">📋 No Due Date ({noDueDateTasks.length})</h2>
              <div className="space-y-2">
                {noDueDateTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {statusFilter !== 'pending' && completedTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">✓ Completed ({completedTasks.length})</h2>
              <div className="space-y-2">
                {completedTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleComplete} />
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500 mb-4">
                {statusFilter === 'pending' && "No pending tasks! You're all caught up 🎉"}
                {statusFilter === 'completed' && "No completed tasks yet"}
                {statusFilter === 'all' && "No tasks yet"}
              </p>
              <Link href="/tasks/new">
                <Button>+ Create Your First Task</Button>
              </Link>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: any;
  onToggle: (id: string, completed: boolean) => void;
  isOverdue?: boolean;
}

function TaskCard({ task, onToggle, isOverdue }: TaskCardProps) {
  return (
    <Card className={`p-4 ${isOverdue ? 'border-l-4 border-red-500 bg-red-50' : ''} ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link href={`/events/${task.id}`}>
                <h3 className={`font-semibold hover:text-blue-600 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                  {task.title}
                </h3>
              </Link>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>

            {/* Priority Badge */}
            {task.priority && !task.completed && (
              <Badge
                variant={
                  task.priority === 'high' ? 'destructive' :
                  task.priority === 'medium' ? 'default' :
                  'secondary'
                }
                className="ml-2"
              >
                {task.priority.toUpperCase()}
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
            {task.dueDate && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                📅 Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
            {task.company && (
              <Link
                href={`/companies/${task.company.id}`}
                className="text-blue-600 hover:underline"
              >
                🏢 {task.company.name}
              </Link>
            )}
            {task.person && (
              <Link
                href={`/people/${task.person.id}`}
                className="text-blue-600 hover:underline"
              >
                👤 {task.person.firstName} {task.person.lastName}
              </Link>
            )}
            {task.deal && (
              <Link
                href={`/deals/${task.deal.id}`}
                className="text-blue-600 hover:underline"
              >
                💼 {task.deal.title}
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
