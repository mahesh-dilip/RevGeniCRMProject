'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

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

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      call: '📞',
      email: '📧',
      meeting: '🤝',
      task: '✅',
      note: '📝',
    };
    return icons[type] || '📅';
  };

  const getPriorityVariant = (priority: string) => {
    const variants: Record<string, any> = {
      high: 'destructive',
      medium: 'secondary',
      low: 'default',
    };
    return variants[priority] || 'default';
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
        <h1 className="text-3xl font-bold">Events & Activities</h1>
        <Link href="/events/new">
          <Button>Add Event</Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center">
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

      {!loading && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">
              No events yet. Start tracking your activities!
            </p>
            <Link href="/events/new">
              <Button>Add First Event</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Showing {filteredEvents.length} of {events.length} events
          </div>

          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className={`transition-all ${
                event.completed ? 'bg-gray-50 opacity-75' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getEventIcon(event.type)}</div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-lg ${
                            event.completed ? 'line-through text-gray-500' : ''
                          }`}>
                            {event.title}
                          </h3>
                          {event.priority && (
                            <Badge variant={getPriorityVariant(event.priority)}>
                              {event.priority}
                            </Badge>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {event.company && (
                            <Link href={`/companies/${event.company.id}`}>
                              <span className="text-blue-600 hover:underline">
                                🏢 {event.company.name}
                              </span>
                            </Link>
                          )}
                          {event.person && (
                            <span>
                              👤 {event.person.firstName} {event.person.lastName}
                            </span>
                          )}
                          {event.deal && (
                            <Link href={`/deals/${event.deal.id}`}>
                              <span className="text-blue-600 hover:underline">
                                💼 {event.deal.title}
                              </span>
                            </Link>
                          )}
                          {event.dueDate && (
                            <span className={
                              new Date(event.dueDate) < new Date() && !event.completed
                                ? 'text-red-600 font-semibold'
                                : ''
                            }>
                              📅 {new Date(event.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={event.completed ? 'outline' : 'default'}
                          onClick={() => handleToggleComplete(event.id, event.completed)}
                        >
                          {event.completed ? '↩ Reopen' : '✓ Complete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
