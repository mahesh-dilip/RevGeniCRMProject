'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEAL_STAGES } from '@/lib/utils/constants';
import { formatCurrency } from '@/lib/utils/formatters';

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals');
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const getTotalValueByStage = (stage: string) => {
    return deals
      .filter((deal) => deal.stage === stage)
      .reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pipeline</h1>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && deals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            No deals yet. Create a deal from a company to get started.
          </CardContent>
        </Card>
      )}

      {!loading && deals.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = getDealsByStage(stage.value);
              const totalValue = getTotalValueByStage(stage.value);

              return (
                <div key={stage.value} className="w-80 flex-shrink-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {stage.label}
                      </CardTitle>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{stageDeals.length} deals</span>
                        <span>{formatCurrency(totalValue)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stageDeals.map((deal) => (
                        <Card
                          key={deal.id}
                          className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm">
                                {deal.title}
                              </h4>
                              {deal.value && (
                                <Badge variant="secondary" className="text-xs">
                                  {formatCurrency(deal.value)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {deal.company?.name}
                            </p>
                            {deal.nextAction && (
                              <p className="text-xs text-gray-500">
                                ⏭️ {deal.nextAction}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}

                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-xs text-gray-400">
                          No deals
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
