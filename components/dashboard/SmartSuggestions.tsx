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
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">💡 Smart Suggestions</h2>
        <div className="space-y-2">
          {topSuggestions.map(suggestion => (
            <Card
              key={suggestion.id}
              className={`p-4 border-l-4 ${
                suggestion.type === 'success' ? 'border-green-500 bg-green-50' :
                suggestion.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{suggestion.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                </div>
                <Link href={suggestion.href}>
                  <Button size="sm" variant="outline" className="whitespace-nowrap">
                    {suggestion.action}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Smart suggestions error:', error);
    return null;
  }
}

