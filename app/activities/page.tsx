
'use client';

import { logError } from '@/lib/logging';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EVENT_ICONS: Record<string, string> = {
  call: '📞',
  email: '📧',
  meeting: '🤝',
  note: '📝',
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      // Filter out tasks - activities are only calls, emails, meetings, notes
      const activitiesOnly = data.filter((event: any) => event.type !== 'task');
      setActivities(activitiesOnly);
    } catch (error) {
      logError('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (typeFilter === 'all') return true;
    return activity.type === typeFilter;
  });

  const activityTypes = [
    { value: 'all', label: 'All Activities', count: activities.length },
    { value: 'call', label: 'Calls', count: activities.filter(a => a.type === 'call').length },
    { value: 'email', label: 'Emails', count: activities.filter(a => a.type === 'email').length },
    { value: 'meeting', label: 'Meetings', count: activities.filter(a => a.type === 'meeting').length },
    { value: 'note', label: 'Notes', count: activities.filter(a => a.type === 'note').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-gray-600">{activities.length} activities logged</p>
        </div>
        <Link href="/activities/new">
          <Button>+ Log Activity</Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Activities</h3>
            <p className="text-sm text-blue-800">
              Activities are historical logs of interactions with your customers - calls you've made, emails you've sent,
              meetings you've had, and notes you've taken. For action items you need to complete, use the{' '}
              <Link href="/tasks" className="underline">Tasks page</Link> instead.
            </p>
          </div>
        </div>
      </Card>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {activityTypes.map((type) => (
          <Button
            key={type.value}
            variant={typeFilter === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(type.value)}
          >
            {type.label} ({type.count})
          </Button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading activities...</div>
      )}

      {!loading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Type</th>
                  <th className="text-left p-4 font-semibold text-sm">Activity</th>
                  <th className="text-left p-4 font-semibold text-sm">Related To</th>
                  <th className="text-left p-4 font-semibold text-sm">Date</th>
                  <th className="text-right p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{EVENT_ICONS[activity.type] || '📋'}</span>
                        <span className="text-sm capitalize">{activity.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="space-y-1">
                        {activity.company && (
                          <Link
                            href={`/companies/${activity.company.id}`}
                            className="block text-blue-600 hover:underline"
                          >
                            🏢 {activity.company.name}
                          </Link>
                        )}
                        {activity.person && (
                          <div className="text-gray-600">
                            👤 {activity.person.firstName} {activity.person.lastName}
                          </div>
                        )}
                        {activity.deal && (
                          <Link
                            href={`/deals/${activity.deal.id}`}
                            className="block text-blue-600 hover:underline"
                          >
                            💼 {activity.deal.title}
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {format(new Date(activity.createdAt), 'MMM d, yyyy')}
                      <div className="text-xs text-gray-400">
                        {format(new Date(activity.createdAt), 'h:mm a')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/events/${activity.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredActivities.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {typeFilter === 'all'
                    ? 'No activities logged yet'
                    : `No ${typeFilter} activities logged yet`}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Start logging your customer interactions to build a complete activity history
                </p>
                <Link href="/activities/new">
                  <Button>+ Log Your First Activity</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
