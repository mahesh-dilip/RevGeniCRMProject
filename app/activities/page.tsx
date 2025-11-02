
'use client';

import { logError } from '@/lib/logging';

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
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
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

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

  // Get unique companies for filter dropdown
  const companies = useMemo(() => {
    const uniqueCompanies = new Map();
    activities.forEach((activity: any) => {
      if (activity.company) {
        uniqueCompanies.set(activity.company.id, activity.company.name);
      }
    });
    return Array.from(uniqueCompanies.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Type filter
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false;

      // Company filter
      if (companyFilter && activity.company?.id !== companyFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = activity.title.toLowerCase().includes(query);
        const matchesDescription = activity.description?.toLowerCase().includes(query);
        const matchesCompany = activity.company?.name.toLowerCase().includes(query);
        const matchesPerson = activity.person
          ? `${activity.person.firstName} ${activity.person.lastName}`.toLowerCase().includes(query)
          : false;

        if (!matchesTitle && !matchesDescription && !matchesCompany && !matchesPerson) {
          return false;
        }
      }

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const activityDate = new Date(activity.createdAt);
        const now = new Date();

        if (dateRangeFilter === '7days' && activityDate < subDays(now, 7)) return false;
        if (dateRangeFilter === '30days' && activityDate < subDays(now, 30)) return false;
        if (dateRangeFilter === '90days' && activityDate < subDays(now, 90)) return false;
      }

      return true;
    });
  }, [activities, typeFilter, companyFilter, searchQuery, dateRangeFilter]);

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

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search activities by title, description, company, or person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-md"
          />
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
          <div className="flex gap-2 items-center">
            <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Date Range:
            </label>
            <select
              id="date-filter"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

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

        {/* Active filters indicator */}
        {(searchQuery || companyFilter || dateRangeFilter !== 'all') && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {filteredActivities.length} of {activities.length} activities</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setCompanyFilter('');
                setDateRangeFilter('all');
                setTypeFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </Button>
          </div>
        )}
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
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a, button')) return;
                    window.location.href = `/events/${activity.id}`;
                  }}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{EVENT_ICONS[activity.type] || '📋'}</span>
                        <span className="text-sm capitalize text-gray-700">{activity.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <Link href={`/events/${activity.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                          {activity.title}
                        </Link>
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
                            className="block text-blue-600 hover:text-blue-800 hover:underline"
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
                            className="block text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            💼 {activity.deal.title}
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {format(new Date(activity.createdAt), 'MMM d, yyyy')}
                      <div className="text-xs text-gray-400">
                        {format(new Date(activity.createdAt), 'h:mm a')}
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
