
'use client';

import { logError } from '@/lib/logging';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Get unique companies for filter dropdown
  const companies = useMemo(() => {
    const uniqueCompanies = new Map();
    tasks.forEach((task: any) => {
      if (task.company) {
        uniqueCompanies.set(task.company.id, task.company.name);
      }
    });
    return Array.from(uniqueCompanies.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      // Status filter
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;

      // Priority filter
      if (priorityFilter && task.priority !== priorityFilter) return false;

      // Company filter
      if (companyFilter && task.company?.id !== companyFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesCompany = task.company?.name.toLowerCase().includes(query);
        const matchesPerson = task.person
          ? `${task.person.firstName} ${task.person.lastName}`.toLowerCase().includes(query)
          : false;

        if (!matchesTitle && !matchesDescription && !matchesCompany && !matchesPerson) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter, companyFilter, searchQuery]);

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

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search tasks by title, description, company, or person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-md"
          />
          <div className="flex gap-2 items-center">
            <label htmlFor="priority-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Priority:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label htmlFor="company-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Company:
            </label>
            <select
              id="company-filter"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">All Companies</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        {/* Active filters indicator */}
        {(searchQuery || priorityFilter || companyFilter) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('');
                setCompanyFilter('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </Button>
          </div>
        )}
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
              <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ml-2 ${
                task.priority === 'high' ? 'bg-red-600 text-white' :
                task.priority === 'medium' ? 'bg-orange-500 text-white' :
                'bg-slate-400 text-white'
              }`}>
                {task.priority === 'high' ? '🔴 ' : task.priority === 'medium' ? '🟠 ' : ''}
                {task.priority.toUpperCase()}
              </span>
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
