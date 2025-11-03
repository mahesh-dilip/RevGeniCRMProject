'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalDealValue: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  closedDeals: number;
  winRate: number;
  avgDealValue: number;
  totalCompanies: number;
  customers: number;
  leadToCustomerRate: number;
  companyToDealRate: number;
  companiesWithDeals: number;
  totalEnrollments: number;
  activeSequences: number;
  totalDeals: number;
  dealsByStage: Array<{
    stage: string;
    stageValue: string;
    count: number;
    value: number;
    avgValue: number;
  }>;
  companiesByStatus: Record<string, number>;
  aiGenerated: number;
  manual: number;
  activityBreakdown: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    deals: number;
    companies: number;
    value: number;
  }>;
}

// Sophisticated, less saturated color palette
const COLORS = {
  primary: '#5b7fc7',      // Muted blue
  success: '#4ead6a',      // Softer green
  warning: '#d9923b',      // Warm amber
  danger: '#d15d5d',       // Softer red
  purple: '#9370b8',       // Muted purple
  indigo: '#6b77c7',       // Softer indigo
  teal: '#4d9b9e',         // Professional teal
  slate: '#6b7a8f',        // Sophisticated gray-blue
  gray: '#6b7280'
};

const STATUS_COLORS: Record<string, string> = {
  'Lead': COLORS.slate,
  'Qualified': COLORS.primary,
  'Customer': COLORS.success,
  'Lost': COLORS.danger
};

// Compact currency formatter for Y-axis
const formatCompactCurrency = (value: number): string => {
  if (value === 0) return '£0';
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  }
  return `£${value}`;
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading || !data) {
    return <LoadingSkeleton />;
  }

  // Prepare data for charts
  const pipelineData = data.dealsByStage
    .filter(s => !['Won', 'Lost'].includes(s.stageValue))
    .map(stage => ({
      name: stage.stage,
      value: stage.value,
      count: stage.count
    }));

  const winRateData = [
    { name: 'Won', value: data.wonDeals, fill: COLORS.success },
    { name: 'Lost', value: data.lostDeals, fill: COLORS.danger }
  ];

  const leadSourceData = [
    { name: 'AI Generated', value: data.aiGenerated, fill: COLORS.purple },
    { name: 'Manual Entry', value: data.manual, fill: COLORS.primary }
  ];

  const statusData = Object.entries(data.companiesByStatus).map(([status, count]) => ({
    name: status,
    value: count,
    fill: STATUS_COLORS[status] || COLORS.gray
  }));

  const activityData = Object.entries(data.activityBreakdown)
    .map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count
    }))
    .sort((a, b) => b.value - a.value);

  // Custom tooltip for currency values
  const CurrencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-blue-600">{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.count && (
            <p className="text-sm text-gray-500">{payload[0].payload.count} deals</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom label renderer with better positioning to prevent cutoff
  const renderPieLabel = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, name, value, percent } = props;

    // Position label further out to prevent cutoff
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

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
            <div className="text-2xl font-bold">{formatCurrency(data.totalDealValue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.activeDeals} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.winRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.wonDeals} won / {data.closedDeals} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.avgDealValue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across {data.totalDeals} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCompanies}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.customers} customers
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
            <div className="text-2xl font-bold">{data.leadToCustomerRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Conversion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Company → Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.companyToDealRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.companiesWithDeals} companies with deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sequence Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEnrollments}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.activeSequences} active sequences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Value by Stage - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Win Rate & Closed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <Pie
                  data={winRateData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-around mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.wonDeals}</div>
                <div className="text-sm text-gray-500">Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.lostDeals}</div>
                <div className="text-sm text-gray-500">Lost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{data.closedDeals}</div>
                <div className="text-sm text-gray-500">Total Closed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-900 font-medium">
                AI Impact: {data.aiGenerated} companies discovered automatically
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Saving time on manual prospecting
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Companies by Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Companies by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Breakdown - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.indigo} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend (6 Months)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Pipeline value (£) shown on left axis, counts shown on right axis
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Value (£)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Count', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Pipeline Value') return formatCurrency(value);
                    return value;
                  }}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  name="Pipeline Value"
                  dot={{ fill: COLORS.success, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="deals"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  name="Deals"
                  dot={{ fill: COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="companies"
                  stroke={COLORS.purple}
                  strokeWidth={3}
                  name="Companies"
                  dot={{ fill: COLORS.purple, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
                {data.dealsByStage.map((stage) => {
                  const pipelinePercentage = data.totalDealValue > 0
                    ? (stage.value / data.totalDealValue) * 100
                    : 0;
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
                  <td className="p-3 text-right font-bold">{data.totalDeals}</td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    {formatCurrency(data.totalDealValue)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(data.avgDealValue)}
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
      <div>
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-80 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
