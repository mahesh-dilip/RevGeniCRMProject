import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ToggleCompleteButton } from './components/ToggleCompleteButton';

const EVENT_ICONS: Record<string, string> = {
  call: '📞',
  email: '📧',
  meeting: '🤝',
  task: '✅',
  note: '📝',
};

export default async function EventDetailPage({
  params
}: {
  params: { id: string }
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      person: true,
      deal: true
    }
  });

  if (!event) {
    notFound();
  }

  const isOverdue = event.dueDate && new Date(event.dueDate) < new Date() && !event.completed;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Events', href: '/events' },
        { label: event.title }
      ]} />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="text-4xl">
            {EVENT_ICONS[event.type] || '📋'}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className={`text-3xl font-bold ${event.completed ? 'line-through text-gray-500' : ''}`}>
                {event.title}
              </h1>
              <Badge variant="secondary" className="capitalize">
                {event.type}
              </Badge>
              {event.completed && (
                <Badge variant="default">✓ Completed</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/events">
            <Button variant="outline">← Back to Events</Button>
          </Link>
          <ToggleCompleteButton
            eventId={event.id}
            completed={event.completed}
          />
        </div>
      </div>

      {/* Overdue Warning */}
      {isOverdue && event.dueDate && (
        <Card className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Overdue</h3>
              <p className="text-sm text-red-800">
                This task was due on {format(new Date(event.dueDate), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {event.description && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </Card>
          )}

          {/* Related Records */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Related To</h2>
            <div className="space-y-4">
              {event.company && (
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Company</p>
                    <Link
                      href={`/companies/${event.company.id}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      🏢 {event.company.name}
                    </Link>
                  </div>
                  <Link href={`/companies/${event.company.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              )}

              {event.person && (
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contact</p>
                    <Link
                      href={`/people/${event.person.id}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      👤 {event.person.firstName} {event.person.lastName}
                    </Link>
                    {event.person.title && (
                      <p className="text-sm text-gray-500">{event.person.title}</p>
                    )}
                  </div>
                  <Link href={`/people/${event.person.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              )}

              {event.deal && (
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Deal</p>
                    <Link
                      href={`/deals/${event.deal.id}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      💼 {event.deal.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Stage: {event.deal.stage}
                    </p>
                  </div>
                  <Link href={`/deals/${event.deal.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              )}

              {!event.company && !event.person && !event.deal && (
                <p className="text-gray-500 text-center py-8">
                  This event is not linked to any company, contact, or deal
                </p>
              )}
            </div>
          </Card>

          {/* Context Information */}
          <Card className="p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Understanding Event Relationships</h3>
                <p className="text-sm text-blue-800">
                  Events can be linked to companies, contacts, and deals. This helps track all activities
                  in one place. For example, a call with a contact about a specific deal will show up
                  in the company timeline, the contact's activity history, and the deal's activity timeline.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Details</h3>
            <div className="space-y-3 text-sm">
              {event.dueDate && (
                <div>
                  <p className="text-gray-600 mb-1">Due Date</p>
                  <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {format(new Date(event.dueDate), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(event.dueDate), 'h:mm a')}
                  </p>
                </div>
              )}

              {event.priority && (
                <div>
                  <p className="text-gray-600 mb-1">Priority</p>
                  <Badge
                    variant={
                      event.priority === 'high' ? 'destructive' :
                      event.priority === 'medium' ? 'default' :
                      'secondary'
                    }
                  >
                    {event.priority.toUpperCase()}
                  </Badge>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-gray-600 mb-1">Created</p>
                <p className="font-medium">
                  {format(new Date(event.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              {event.source && (
                <div>
                  <p className="text-gray-600 mb-1">Source</p>
                  <Badge variant="secondary">{event.source}</Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              {event.companyId && (
                <Link href={`/events/new?companyId=${event.companyId}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    📅 Log Another Activity
                  </Button>
                </Link>
              )}
              {event.dealId && (
                <Link href={`/deals/${event.dealId}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    💼 View Deal
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
