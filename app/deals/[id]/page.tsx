import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityTimeline } from '@/components/events/ActivityTimeline';
import { formatCurrency } from '@/lib/utils/formatters';
import { format } from 'date-fns';
import { DEAL_STAGES } from '@/lib/utils/constants';
import { StageUpdater } from './components/StageUpdater';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default async function DealDetailPage({
  params
}: {
  params: { id: string }
}) {
  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      primaryContact: true,
      events: {
        orderBy: { createdAt: 'desc' },
        include: {
          company: true,
          person: true
        }
      }
    }
  });

  if (!deal) {
    notFound();
  }

  const currentStageIndex = DEAL_STAGES.findIndex(s => s.value === deal.stage);
  const totalStages = DEAL_STAGES.filter(s => !['Won', 'Lost'].includes(s.value)).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Deals', href: '/deals' },
        { label: 'Companies', href: '/companies' },
        { label: deal.company.name, href: `/companies/${deal.company.id}` },
        { label: deal.title }
      ]} />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <Badge variant={
              deal.stage === 'Won' ? 'default' :
              deal.stage === 'Lost' ? 'destructive' :
              'secondary'
            }>
              {deal.stage}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <Link
              href={`/companies/${deal.company.id}`}
              className="text-blue-600 hover:underline"
            >
              🏢 {deal.company.name}
            </Link>
            {deal.value && (
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(deal.value)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/deals">
            <Button variant="outline">← Back to Pipeline</Button>
          </Link>
          <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}`}>
            <Button>+ Log Activity</Button>
          </Link>
        </div>
      </div>

      {/* Key Info Cards - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primary Contact */}
        {deal.primaryContact && (
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Primary Contact</p>
            <Link
              href={`/people/${deal.primaryContact.id}`}
              className="font-semibold text-blue-600 hover:underline"
            >
              {deal.primaryContact.firstName} {deal.primaryContact.lastName}
            </Link>
            {deal.primaryContact.title && (
              <p className="text-xs text-gray-500 mt-1">{deal.primaryContact.title}</p>
            )}
          </Card>
        )}

        {/* Expected Close */}
        {deal.closeDate && (
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Expected Close Date</p>
            <p className="font-semibold">
              {format(new Date(deal.closeDate), 'MMM d, yyyy')}
            </p>
          </Card>
        )}

        {/* Win Probability */}
        {deal.probability !== null && deal.stage !== 'Won' && deal.stage !== 'Lost' && (
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Win Probability</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
              <span className="font-semibold text-lg">{deal.probability}%</span>
            </div>
          </Card>
        )}
      </div>

      {/* Next Action / Lost Reason - Full Width Banner */}
      {deal.nextAction && deal.stage !== 'Won' && deal.stage !== 'Lost' && (
        <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Next Action</h3>
              <p className="text-sm text-blue-800">{deal.nextAction}</p>
            </div>
          </div>
        </Card>
      )}

      {deal.lostReason && deal.stage === 'Lost' && (
        <Card className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Lost Reason</h3>
              <p className="text-sm text-red-800">{deal.lostReason}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stage Updater */}
      <StageUpdater dealId={deal.id} currentStage={deal.stage} />

      {/* Stage Progress - Horizontal */}
      {deal.stage !== 'Won' && deal.stage !== 'Lost' && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Deal Progress</h2>
          <div className="flex items-center justify-between">
            {DEAL_STAGES.filter(s => !['Won', 'Lost'].includes(s.value)).map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isLast = index === DEAL_STAGES.filter(s => !['Won', 'Lost'].includes(s.value)).length - 1;

              return (
                <div key={stage.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      isCurrent ? 'font-semibold text-blue-600' :
                      isCompleted ? 'text-gray-600' :
                      'text-gray-400'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-1 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Compact Info */}
        <div className="space-y-4">
          {/* Details Card - Compact */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium text-xs">
                  {format(new Date(deal.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              {deal.stageChangedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Stage Changed:</span>
                  <span className="font-medium text-xs">
                    {format(new Date(deal.stageChangedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Activities:</span>
                <Badge variant="secondary">{deal.events.length}</Badge>
              </div>
            </div>
          </Card>

          {/* Description - Collapsible if long */}
          {deal.description && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-sm">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{deal.description}</p>
            </Card>
          )}

          {/* Quick Actions - Compact Grid */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
            <p className="text-xs text-gray-500 mb-3">
              Log past activities related to this deal
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=call`}>
                <Button variant="outline" size="sm" className="w-full">
                  📞 Log Call
                </Button>
              </Link>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=meeting`}>
                <Button variant="outline" size="sm" className="w-full">
                  🤝 Log Meeting
                </Button>
              </Link>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=email`}>
                <Button variant="outline" size="sm" className="w-full">
                  📧 Log Email
                </Button>
              </Link>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=task`}>
                <Button variant="outline" size="sm" className="w-full">
                  ✅ Log Task
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Activity Timeline</h2>
            <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}`}>
              <Button size="sm">+ Log Activity</Button>
            </Link>
          </div>
          {deal.events.length > 0 ? (
            <ActivityTimeline events={deal.events} />
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500 mb-4">No activities yet</p>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}`}>
                <Button>+ Log First Activity</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
