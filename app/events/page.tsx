'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      fetchEvents();
      toast.success(!currentStatus ? 'Event marked as completed' : 'Event marked as pending');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const EVENT_ICONS: Record<string, string> = {
    call: '📞',
    email: '📧',
    meeting: '🤝',
    task: '✅',
    note: '📝',
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'pending' && event.completed) return false;
    if (filter === 'completed' && !event.completed) return false;
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Events & Activities</h1>
          <p className="text-gray-600">{events.length} activities tracked</p>
        </div>
        <Link href="/events/new">
          <Button>+ Log Activity</Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({events.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({events.filter(e => !e.completed).length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({events.filter(e => e.completed).length})
          </Button>
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md"
          >
            <option value="all">All Types</option>
            <option value="call">📞 Calls</option>
            <option value="email">📧 Emails</option>
            <option value="meeting">🤝 Meetings</option>
            <option value="task">✅ Tasks</option>
            <option value="note">📝 Notes</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading events...</div>
      )}

      {!loading && (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Type</th>
                    <th className="text-left p-4 font-semibold text-sm">Title</th>
                    <th className="text-left p-4 font-semibold text-sm">Related To</th>
                    <th className="text-left p-4 font-semibold text-sm">Due Date</th>
                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                    <th className="text-right p-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className={`border-b hover:bg-gray-50 ${event.completed ? 'opacity-60' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{EVENT_ICONS[event.type] || '📋'}</span>
                          <span className="text-sm capitalize">{event.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={event.completed ? 'line-through text-gray-500' : ''}>
                          <p className="font-medium">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="space-y-1">
                          {event.company && (
                            <Link
                              href={`/companies/${event.company.id}`}
                              className="block text-blue-600 hover:underline"
                            >
                              🏢 {event.company.name}
                            </Link>
                          )}
                          {event.person && (
                            <div className="text-gray-600">
                              👤 {event.person.firstName} {event.person.lastName}
                            </div>
                          )}
                          {event.deal && (
                            <Link
                              href={`/deals/${event.deal.id}`}
                              className="block text-blue-600 hover:underline"
                            >
                              💼 {event.deal.title}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {event.dueDate ? (
                          <span className={
                            new Date(event.dueDate) < new Date() && !event.completed
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                          }>
                            {format(new Date(event.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {event.type === 'task' && (
                          <Badge variant={event.completed ? 'default' : 'secondary'}>
                            {event.completed ? '✓ Done' : 'Open'}
                          </Badge>
                        )}
                        {event.priority && event.type === 'task' && !event.completed && (
                          <Badge
                            variant={
                              event.priority === 'high' ? 'destructive' :
                              event.priority === 'medium' ? 'default' :
                              'secondary'
                            }
                            className="ml-2"
                          >
                            {event.priority}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          {event.type === 'task' && (
                            <Button
                              size="sm"
                              variant={event.completed ? 'outline' : 'default'}
                              onClick={() => handleToggleComplete(event.id, event.completed)}
                            >
                              {event.completed ? '↩' : '✓'}
                            </Button>
                          )}
                          <Link href={`/companies/${event.companyId}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {events.length === 0 ? (
                    <>
                      <p className="mb-4">No activities yet.</p>
                      <Link href="/events/new">
                        <Button>+ Log Your First Activity</Button>
                      </Link>
                    </>
                  ) : (
                    <p>No activities match your filters.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
