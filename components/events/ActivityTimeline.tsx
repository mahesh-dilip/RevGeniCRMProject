'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ActivityTimelineProps {
  events: any[];
  dealId?: string;
  companyId?: string;
}

export function ActivityTimeline({ events, dealId, companyId }: ActivityTimelineProps) {
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

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 mb-4">No activity yet</p>
        <Link
          href={`/events/new?${dealId ? `dealId=${dealId}` : companyId ? `companyId=${companyId}` : ''}`}
        >
          <button className="text-blue-600 hover:underline">Add first activity</button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getEventIcon(event.type)}</div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-semibold ${event.completed ? 'line-through text-gray-500' : ''}`}>
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                </div>
                {event.completed !== undefined && (
                  <Badge variant={event.completed ? 'success' : 'secondary'}>
                    {event.completed ? 'Completed' : 'Pending'}
                  </Badge>
                )}
              </div>

              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>{format(new Date(event.createdAt), 'PPp')}</span>
                {event.person && (
                  <span>👤 {event.person.firstName} {event.person.lastName}</span>
                )}
                {event.company && (
                  <Link href={`/companies/${event.company.id}`}>
                    <span className="text-blue-600 hover:underline">
                      🏢 {event.company.name}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
