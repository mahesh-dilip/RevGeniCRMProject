import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatters';
import { DEAL_STAGES } from '@/lib/utils/constants';

async function AnalyticsContent() {
  const [deals, companies, events, sequences] = await Promise.all([
    prisma.deal.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.company.findMany({
      select: {
        id: true,
        status: true,
        sourceType: true,
        createdAt: true,
        _count: {
          select: { deals: true }
        }
      }
    }),
    prisma.event.findMany({
      select: {
        type: true,
        createdAt: true,
        completed: true
      }
    }),
    prisma.emailSequence.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        _count: {
          select: { enrollments: true }
        }
      }
    })
  ]);

  // Calculate key metrics
  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const activeDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage));
  const wonDeals = deals.filter(d => d.stage === 'Won');
  const lostDeals = deals.filter(d => d.stage === 'Lost');
  const closedDeals = wonDeals.length + lostDeals.length;
  const winRate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0;
  const avgDealValue = deals.length > 0 ? totalDealValue / deals.length : 0;

  // Deal value by stage
  const dealsByStage = DEAL_STAGES.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage.value);
    const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    return {
      stage: stage.label,
      stageValue: stage.value,
      count: stageDeals.length,
      value: totalValue,
      avgValue: stageDeals.length > 0 ? totalValue / stageDeals.length : 0
    };
  });

  const maxStageValue = Math.max(...dealsByStage.map(s => s.value), 1);

  // Companies by status
  const companiesByStatus = companies.reduce((acc, company) => {
    const status = company.status || 'Lead';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Lead sources
  const aiGenerated = companies.filter(c => c.sourceType === 'ai_agent').length;
  const manual = companies.filter(c => c.sourceType === 'manual' || !c.sourceType).length;

  // Activity breakdown
  const activityBreakdown = events.reduce((acc, event) => {
    const type = event.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Conversion rates
  const companiesWithDeals = companies.filter(c => c._count.deals > 0).length;
  const leadToCustomerRate = companies.length > 0
    ? Math.round((companiesByStatus['Customer'] || 0) / companies.length * 100)
    : 0;
  const companyToDealRate = companies.length > 0
    ? Math.round((companiesWithDeals / companies.length) * 100)
    : 0;

  // Monthly trend (last 6 months)
  const monthlyTrend: Array<{ month: string; deals: number; companies: number; value: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    const monthDeals = deals.filter(d => {
      const dealDate = new Date(d.createdAt);
      return dealDate.getMonth() === date.getMonth() &&
             dealDate.getFullYear() === date.getFullYear();
    });

    const monthCompanies = companies.filter(c => {
      const companyDate = new Date(c.createdAt);
      return companyDate.getMonth() === date.getMonth() &&
             companyDate.getFullYear() === date.getFullYear();
    });

    monthlyTrend.push({
      month: monthName,
      deals: monthDeals.length,
      companies: monthCompanies.length,
      value: monthDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    });
  }

  // Sequence performance
  const totalEnrollments = sequences.reduce((sum, seq) => sum + seq._count.enrollments, 0);
  const activeSequences = sequences.filter(s => s.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into your sales performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDealValue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activeDeals.length} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {wonDeals.length} won / {closedDeals} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgDealValue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across {deals.length} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {companiesByStatus['Customer'] || 0} customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Lead → Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadToCustomerRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Conversion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Company → Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyToDealRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {companiesWithDeals} companies with deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sequence Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activeSequences} active sequences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dealsByStage.filter(s => !['Won', 'Lost'].includes(s.stageValue)).map(stage => {
                const percentage = maxStageValue > 0 ? (stage.value / maxStageValue) * 100 : 0;

                return (
                  <div key={stage.stageValue}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(stage.value)}</span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        {percentage > 15 && (
                          <span className="text-xs font-medium text-white">
                            {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
                          </span>
                        )}
                      </div>
                    </div>
                    {percentage <= 15 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Circle */}
        <Card>
          <CardHeader>
            <CardTitle>Win Rate & Closed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#22c55e"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(winRate / 100) * 502.4} 502.4`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{winRate}%</div>
                    <div className="text-sm text-gray-500 mt-1">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-around mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{wonDeals.length}</div>
                <div className="text-sm text-gray-500">Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lostDeals.length}</div>
                <div className="text-sm text-gray-500">Lost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{closedDeals}</div>
                <div className="text-sm text-gray-500">Total Closed</div>
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
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">🤖 AI Generated</span>
                  <span className="font-semibold text-purple-600">
                    {aiGenerated} ({companies.length > 0 ? Math.round((aiGenerated / companies.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                    style={{ width: `${companies.length > 0 ? (aiGenerated / companies.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">✍️ Manual Entry</span>
                  <span className="font-semibold text-blue-600">
                    {manual} ({companies.length > 0 ? Math.round((manual / companies.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${companies.length > 0 ? (manual / companies.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-900 font-medium">
                AI Impact: {aiGenerated} companies discovered automatically
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Saving time on manual prospecting
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Companies by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Companies by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(companiesByStatus).map(([status, count]) => {
                const percentage = companies.length > 0 ? (count / companies.length) * 100 : 0;
                const colors = {
                  'Lead': 'bg-gray-500',
                  'Qualified': 'bg-blue-500',
                  'Customer': 'bg-green-500',
                  'Lost': 'bg-red-500'
                } as Record<string, string>;

                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{status}</span>
                      <span className="font-semibold">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${colors[status] || 'bg-gray-500'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activityBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const maxActivity = Math.max(...Object.values(activityBreakdown));
                  const percentage = (count / maxActivity) * 100;
                  const icons = {
                    'call': '📞',
                    'email': '📧',
                    'meeting': '🤝',
                    'note': '📝',
                    'task': '✅'
                  } as Record<string, string>;

                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">
                          {icons[type] || '📋'} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-5 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrend.map((month) => (
                <div key={month.month}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{month.month}</span>
                    <div className="text-right">
                      <span className="font-semibold text-blue-600">{month.deals} deals</span>
                      <span className="text-gray-500 text-xs ml-2">
                        ({month.companies} companies)
                      </span>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                      style={{
                        width: `${month.value > 0 ? Math.max((month.value / Math.max(...monthlyTrend.map(m => m.value))) * 100, 5) : 5}%`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(month.value)} pipeline value
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Stage Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Stage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-sm">Stage</th>
                  <th className="text-right p-3 font-semibold text-sm">Count</th>
                  <th className="text-right p-3 font-semibold text-sm">Total Value</th>
                  <th className="text-right p-3 font-semibold text-sm">Avg Value</th>
                  <th className="text-right p-3 font-semibold text-sm">% of Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {dealsByStage.map((stage) => {
                  const pipelinePercentage = totalDealValue > 0 ? (stage.value / totalDealValue) * 100 : 0;
                  return (
                    <tr key={stage.stageValue} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{stage.stage}</td>
                      <td className="p-3 text-right">{stage.count}</td>
                      <td className="p-3 text-right font-semibold text-blue-600">
                        {formatCurrency(stage.value)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(stage.avgValue)}
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        {pipelinePercentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="p-3 font-bold">Total</td>
                  <td className="p-3 text-right font-bold">{deals.length}</td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    {formatCurrency(totalDealValue)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(avgDealValue)}
                  </td>
                  <td className="p-3 text-right font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
