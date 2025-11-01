
'use client';

import { logError } from '@/lib/logging';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEAL_STAGES } from '@/lib/utils/constants';
import { formatCurrency } from '@/lib/utils/formatters';

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);

  // Fetch deals with React Query
  const { data: allDeals = [], isLoading: loading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await fetch('/api/deals');
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }
      return response.json();
    },
  });

  // Get top companies for filters
  const topCompanies = useMemo(() => {
    const companyCounts = allDeals.reduce((acc: any, deal: any) => {
      const companyName = deal.company?.name || 'Unknown';
      acc[companyName] = (acc[companyName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(companyCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([name]) => name);
  }, [allDeals]);

  // Filter deals
  const deals = allDeals.filter((deal: any) => {
    const matchesSearch = !searchQuery ||
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = !companyFilter || deal.company?.name === companyFilter;

    return matchesSearch && matchesCompany;
  });

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal: any) => deal.stage === stage);
  };

  const getTotalValueByStage = (stage: string) => {
    return deals
      .filter((deal: any) => deal.stage === stage)
      .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deals Pipeline</h1>
          <p className="text-gray-600">Manage your sales opportunities</p>
        </div>
        <Link href="/deals/new">
          <Button size="lg">+ Create Deal</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && allDeals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            No deals yet. Create a deal from a company to get started.
          </CardContent>
        </Card>
      )}

      {!loading && allDeals.length > 0 && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="Search deals by name, company, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-md"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!companyFilter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompanyFilter(null)}
              >
                All Companies
              </Button>
              {topCompanies.map((company: string) => (
                <Button
                  key={company}
                  variant={companyFilter === company ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompanyFilter(company)}
                >
                  {company}
                </Button>
              ))}
            </div>
          </div>

          {deals.length === 0 && (searchQuery || companyFilter) && (
            <Card>
              <CardContent className="py-12 text-center text-gray-600">
                No deals match your filters. Try adjusting your search.
              </CardContent>
            </Card>
          )}

          {deals.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = getDealsByStage(stage.value);
              const totalValue = getTotalValueByStage(stage.value);

              const stageColors: { [key: string]: string } = {
                'Prospecting': 'border-gray-400',
                'Qualified': 'border-blue-400',
                'Demo': 'border-purple-400',
                'Proposal': 'border-yellow-400',
                'Negotiation': 'border-orange-400',
                'Won': 'border-green-400',
                'Lost': 'border-red-400'
              };

              return (
                <div key={stage.value} className="flex-shrink-0 w-80">
                  <div className={`bg-white rounded-lg shadow-sm border-t-4 ${stageColors[stage.value]} h-full`}>
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-base">{stage.label}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {stageDeals.length}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>

                    <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                      {stageDeals.map((deal: any) => {
                        const borderColor =
                          stage.value === 'Won' ? '#10b981' :
                          stage.value === 'Lost' ? '#ef4444' :
                          stage.value === 'Negotiation' ? '#f59e0b' :
                          stage.value === 'Proposal' ? '#eab308' :
                          '#3b82f6';

                        return (
                          <Link
                            key={deal.id}
                            href={`/deals/${deal.id}`}
                            className="block"
                          >
                            <Card className="p-3 hover:shadow-md transition-all cursor-pointer border-l-4" style={{ borderLeftColor: borderColor }}>
                              <div className="mb-2">
                                <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                                  {deal.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {deal.company?.name}
                                </p>
                              </div>

                              {deal.value && (
                                <div className="mb-2">
                                  <p className="text-base font-bold text-green-600">
                                    {formatCurrency(deal.value)}
                                  </p>
                                </div>
                              )}

                              {deal.nextAction && stage.value !== 'Won' && stage.value !== 'Lost' && (
                                <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded mb-2">
                                  <p className="font-medium">🎯 Next: {deal.nextAction}</p>
                                </div>
                              )}

                              {deal.probability && stage.value !== 'Won' && stage.value !== 'Lost' && (
                                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                                  <span>Win probability</span>
                                  <span className="font-medium">{deal.probability}%</span>
                                </div>
                              )}
                            </Card>
                          </Link>
                        );
                      })}

                      {stageDeals.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-400">No deals</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
}
