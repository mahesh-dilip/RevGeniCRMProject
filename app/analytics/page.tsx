'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  // Fetch deals data
  const { data: dealsData = [] } = useQuery({
    queryKey: ['deals-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/deals');
      if (!response.ok) throw new Error('Failed to fetch deals');
      const data = await response.json();
      return data.deals || [];
    },
  });

  // Fetch companies data
  const { data: companiesData = [] } = useQuery({
    queryKey: ['companies-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      return data.companies || [];
    },
  });

  // Fetch events data
  const { data: eventsData = [] } = useQuery({
    queryKey: ['events-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  // Calculate metrics
  const dealsByStage = dealsData.reduce((acc: any, deal: any) => {
    const stage = deal.stage || 'unknown';
    const existing = acc.find((item: any) => item.stage === stage);
    if (existing) {
      existing.value += deal.value || 0;
      existing.count += 1;
    } else {
      acc.push({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        value: deal.value || 0,
        count: 1,
      });
    }
    return acc;
  }, []);

  const companiesByStatus = companiesData.reduce((acc: any, company: any) => {
    const status = company.status || 'unknown';
    const existing = acc.find((item: any) => item.status === status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: 1,
      });
    }
    return acc;
  }, []);

  // Calculate win rate
  const wonDeals = dealsData.filter((d: any) => d.stage === 'won').length;
  const lostDeals = dealsData.filter((d: any) => d.stage === 'lost').length;
  const totalClosed = wonDeals + lostDeals;
  const winRate = totalClosed > 0 ? ((wonDeals / totalClosed) * 100).toFixed(1) : 0;

  // Calculate average deal value
  const totalValue = dealsData.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
  const avgDealValue = dealsData.length > 0 ? (totalValue / dealsData.length).toFixed(0) : 0;

  // Activity breakdown
  const activityTypes = eventsData.reduce((acc: any, event: any) => {
    const type = event.type || 'other';
    const existing = acc.find((item: any) => item.type === type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: 1,
      });
    }
    return acc;
  }, []);

  // Monthly pipeline trend (last 6 months)
  const monthlyTrend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    const deals = dealsData.filter((d: any) => {
      const dealDate = new Date(d.createdAt);
      return dealDate.getMonth() === date.getMonth() &&
             dealDate.getFullYear() === date.getFullYear();
    });

    monthlyTrend.push({
      month: monthName,
      deals: deals.length,
      value: deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your sales performance and pipeline health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Deals</p>
          <p className="text-3xl font-bold">{dealsData.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${(totalValue / 1000).toFixed(0)}K pipeline
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Win Rate</p>
          <p className="text-3xl font-bold">{winRate}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {wonDeals} won, {lostDeals} lost
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg Deal Value</p>
          <p className="text-3xl font-bold">${(Number(avgDealValue) / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">
            Across all deals
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Companies</p>
          <p className="text-3xl font-bold">{companiesData.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {companiesData.filter((c: any) => c.status === 'customer').length} customers
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Value by Stage */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Deal Value by Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealsByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(1)}K`} />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Total Value" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Companies by Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Companies by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={companiesByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.status}: ${entry.count}`}
              >
                {companiesByStatus.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Pipeline Trend */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Pipeline Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="deals"
                stroke="#3b82f6"
                name="Deals Created"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                name="Pipeline Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Activities" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Deal Stage Details Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Deal Stage Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">Stage</th>
                <th className="text-right p-3 font-semibold text-sm">Count</th>
                <th className="text-right p-3 font-semibold text-sm">Total Value</th>
                <th className="text-right p-3 font-semibold text-sm">Avg Value</th>
              </tr>
            </thead>
            <tbody>
              {dealsByStage.map((stage: any) => (
                <tr key={stage.stage} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{stage.stage}</td>
                  <td className="p-3 text-right">{stage.count}</td>
                  <td className="p-3 text-right">${(stage.value / 1000).toFixed(1)}K</td>
                  <td className="p-3 text-right">
                    ${(stage.value / stage.count / 1000).toFixed(1)}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
