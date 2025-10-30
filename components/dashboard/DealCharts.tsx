import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatters';
import { DEAL_STAGES } from '@/lib/utils/constants';

export async function DealCharts() {
  try {
    const deals = await prisma.deal.findMany({
      select: {
        stage: true,
        value: true,
        createdAt: true
      }
    });

    // Deal value by stage
    const stageData = DEAL_STAGES.reduce((acc, stage) => {
      const stageDeals = deals.filter(d => d.stage === stage.value);
      const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      acc[stage.value] = {
        count: stageDeals.length,
        value: totalValue
      };
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Win rate
    const wonDeals = deals.filter(d => d.stage === 'Won').length;
    const lostDeals = deals.filter(d => d.stage === 'Lost').length;
    const closedDeals = wonDeals + lostDeals;
    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    // Lead source breakdown
    const companies = await prisma.company.findMany({
      select: { sourceType: true }
    });
    const aiGenerated = companies.filter(c => c.sourceType === 'ai_agent').length;
    const manual = companies.filter(c => c.sourceType === 'manual' || !c.sourceType).length;
    const total = companies.length;

    const maxValue = Math.max(...Object.values(stageData).map(s => s.value), 1);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Deal Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEAL_STAGES.filter(s => !['Won', 'Lost'].includes(s.value)).map(stage => {
                const data = stageData[stage.value];
                const percentage = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                
                return (
                  <div key={stage.value}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{stage.label}</span>
                      <span className="font-semibold">{formatCurrency(data.value)}</span>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {data.count} {data.count === 1 ? 'deal' : 'deals'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Win Rate & Lead Sources */}
        <div className="space-y-6">
          {/* Win Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#22c55e"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(winRate / 100) * 440} 440`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{winRate}%</div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-around mt-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{wonDeals}</div>
                  <div className="text-gray-500">Won</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{lostDeals}</div>
                  <div className="text-gray-500">Lost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>🤖 AI Generated</span>
                    <span className="font-semibold">
                      {aiGenerated} ({total > 0 ? Math.round((aiGenerated / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${total > 0 ? (aiGenerated / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>✍️ Manual Entry</span>
                    <span className="font-semibold">
                      {manual} ({total > 0 ? Math.round((manual / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${total > 0 ? (manual / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Chart error:', error);
    return null;
  }
}

