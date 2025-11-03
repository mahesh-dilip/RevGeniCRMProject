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


export const dynamic = 'force-dynamic';
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
              className="text-blue-600 hover:underline flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {deal.company.name}
            </Link>
            {deal.value && (
              <span className="text-2xl font-bold text-emerald-600 tabular-nums">
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
            <p className="text-sm text-gray-600 mb-2">Win Probability</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-300 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm transition-all"
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
              <span className="font-bold text-2xl text-blue-600 tabular-nums">{deal.probability}%</span>
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
              const isNext = index === currentStageIndex + 1;
              const isLast = index === DEAL_STAGES.filter(s => !['Won', 'Lost'].includes(s.value)).length - 1;

              return (
                <div key={stage.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ${
                      isCompleted ? 'bg-emerald-500 text-white ring-2 ring-emerald-200' :
                      isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 scale-110' :
                      isNext ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-[80px] ${
                      isCurrent ? 'font-bold text-blue-700' :
                      isCompleted ? 'font-medium text-emerald-600' :
                      isNext ? 'font-medium text-blue-500' :
                      'text-gray-400'
                    }`}>
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-blue-600 font-medium mt-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-1.5 mx-2 rounded-full ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
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
              Log activities related to this deal
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=call`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </Button>
              </Link>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=meeting`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Meeting
                </Button>
              </Link>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=email`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Button>
              </Link>
              <Link href={`/events/new?dealId=${deal.id}&companyId=${deal.companyId}&type=task`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Task
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
