import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { subDays } from 'date-fns';

export async function SmartSuggestions() {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const fourteenDaysAgo = subDays(new Date(), 14);

    const [
      companiesWithNoPeople,
      staleLeads,
      stuckDeals,
      highConfidenceLeads
    ] = await Promise.all([
      // Companies with no people
      prisma.company.findMany({
        where: {
          people: { none: {} },
          status: { in: ['Lead', 'Qualified'] }
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      }),

      // Leads with no activity for 30+ days
      prisma.company.findMany({
        where: {
          status: 'Lead',
          events: { none: {} },
          createdAt: { lte: thirtyDaysAgo }
        },
        take: 3,
        orderBy: { createdAt: 'asc' }
      }),

      // Deals stuck in same stage for 14+ days
      prisma.deal.findMany({
        where: {
          stage: { notIn: ['Won', 'Lost'] },
          stageChangedAt: { lte: fourteenDaysAgo }
        },
        include: { company: true },
        take: 3,
        orderBy: { stageChangedAt: 'asc' }
      }),

      // High confidence AI leads without deals
      prisma.company.findMany({
        where: {
          sourceType: 'ai_agent',
          confidence: { gte: 0.8 },
          deals: { none: {} }
        },
        take: 3,
        orderBy: { confidence: 'desc' }
      })
    ]);

    interface Suggestion {
      id: string;
      icon: string;
      title: string;
      description: string;
      action: string;
      href: string;
      type: 'info' | 'warning' | 'success';
    }

    const suggestions: Suggestion[] = [];

    // Add suggestions
    companiesWithNoPeople.forEach(company => {
      suggestions.push({
        id: `no-people-${company.id}`,
        icon: '👥',
        title: 'Add contacts to improve engagement',
        description: `${company.name} has no contacts yet`,
        action: 'Add Person',
        href: `/people/new?companyId=${company.id}`,
        type: 'info'
      });
    });

    staleLeads.forEach(company => {
      suggestions.push({
        id: `stale-${company.id}`,
        icon: '⏰',
        title: 'Time to follow up?',
        description: `${company.name} hasn't been contacted in 30+ days`,
        action: 'Log Activity',
        href: `/events/new?companyId=${company.id}`,
        type: 'warning'
      });
    });

    stuckDeals.forEach(deal => {
      suggestions.push({
        id: `stuck-${deal.id}`,
        icon: '🚀',
        title: 'Need help moving this forward?',
        description: `${deal.title} stuck in ${deal.stage} for 14+ days`,
        action: 'Update Deal',
        href: `/deals/${deal.id}`,
        type: 'warning'
      });
    });

    highConfidenceLeads.forEach(company => {
      suggestions.push({
        id: `hot-lead-${company.id}`,
        icon: '🔥',
        title: 'Create deal now?',
        description: `${company.name} is a high-confidence lead (${Math.round((company.confidence || 0) * 100)}%)`,
        action: 'Create Deal',
        href: `/deals/new?companyId=${company.id}`,
        type: 'success'
      });
    });

    // Limit to 5 suggestions
    const topSuggestions = suggestions.slice(0, 5);

    if (topSuggestions.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">💡 Smart Suggestions</h2>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {topSuggestions.length} action{topSuggestions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {topSuggestions.map(suggestion => {
            const typeStyles = {
              success: {
                border: 'border-emerald-500',
                bg: 'bg-emerald-50',
                iconBg: 'bg-emerald-100',
                textColor: 'text-emerald-900',
                descColor: 'text-emerald-700'
              },
              warning: {
                border: 'border-amber-500',
                bg: 'bg-amber-50',
                iconBg: 'bg-amber-100',
                textColor: 'text-amber-900',
                descColor: 'text-amber-700'
              },
              info: {
                border: 'border-blue-500',
                bg: 'bg-blue-50',
                iconBg: 'bg-blue-100',
                textColor: 'text-blue-900',
                descColor: 'text-blue-700'
              }
            };
            const style = typeStyles[suggestion.type];

            return (
              <Card
                key={suggestion.id}
                className={`p-4 border-l-4 ${style.border} ${style.bg} hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`${style.iconBg} rounded-lg p-2 flex-shrink-0`}>
                      <span className="text-xl leading-none">{suggestion.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm ${style.textColor}`}>
                        {suggestion.title}
                      </h3>
                      <p className={`text-xs ${style.descColor} mt-1`}>
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <Link href={suggestion.href} className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant={suggestion.type === 'success' ? 'default' : 'outline'}
                      className={`whitespace-nowrap ${
                        suggestion.type === 'success'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : ''
                      }`}
                    >
                      {suggestion.action}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Smart suggestions error:', error);
    return null;
  }
}

