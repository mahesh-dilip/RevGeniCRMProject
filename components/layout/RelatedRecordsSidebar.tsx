import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface RelatedRecordsSidebarProps {
  company?: {
    id: string;
    name: string;
    status: string;
    _count?: {
      people: number;
      deals: number;
      events: number;
    };
    lastEngaged?: Date | null;
    sequenceEnrollments?: Array<{
      id: string;
      status: string;
      sequence: {
        name: string;
      };
      pauseReason?: string | null;
    }>;
  };
  deal?: {
    id: string;
    title: string;
    stage: string;
    value?: number | null;
    company: {
      id: string;
      name: string;
    };
    events?: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: Date;
    }>;
  };
  recentEvents?: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: Date;
  }>;
}

export function RelatedRecordsSidebar({ company, deal, recentEvents }: RelatedRecordsSidebarProps) {
  if (!company && !deal) return null;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Quick Info</h3>

      {company && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <Badge>{company.status}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Contacts:</span>
              <span className="font-medium">{company._count?.people || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Deals:</span>
              <span className="font-medium">{company._count?.deals || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Activities:</span>
              <span className="font-medium">{company._count?.events || 0}</span>
            </div>
            {company.lastEngaged && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Contact:</span>
                <span className="text-xs">{formatDistanceToNow(new Date(company.lastEngaged), { addSuffix: true })}</span>
              </div>
            )}
          </div>

          {company.sequenceEnrollments && company.sequenceEnrollments.length > 0 && (
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-2">Email Sequences</h4>
              <div className="space-y-2">
                {company.sequenceEnrollments.map(enrollment => (
                  <div key={enrollment.id} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">{enrollment.sequence.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {enrollment.status}
                      </Badge>
                      {enrollment.pauseReason && (
                        <span className="text-gray-500">{enrollment.pauseReason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {deal && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Company:</span>
              <Link href={`/companies/${deal.company.id}`} className="text-blue-600 hover:underline text-xs">
                {deal.company.name}
              </Link>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stage:</span>
              <Badge>{deal.stage}</Badge>
            </div>
            {deal.value && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Value:</span>
                <span className="font-semibold">${deal.value.toLocaleString()}</span>
              </div>
            )}
          </div>
        </>
      )}

      {recentEvents && recentEvents.length > 0 && (
        <div className="pt-3 border-t">
          <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {recentEvents.slice(0, 3).map(event => (
              <div key={event.id} className="text-xs bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <span>
                    {event.type === 'call' && '📞'}
                    {event.type === 'email' && '📧'}
                    {event.type === 'meeting' && '🤝'}
                    {event.type === 'task' && '✅'}
                    {event.type === 'note' && '📝'}
                  </span>
                  <span className="font-medium">{event.title}</span>
                </div>
                <div className="text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

