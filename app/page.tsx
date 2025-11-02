import { logError } from '@/lib/logging';

import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { SmartSuggestions } from '@/components/dashboard/SmartSuggestions';
import { DealCharts } from '@/components/dashboard/DealCharts';


export const dynamic = 'force-dynamic';
async function DashboardMetrics() {
  try {
    const [companiesCount, dealsData, tasksData] = await Promise.all([
      prisma.company.count(),
      prisma.deal.findMany({
        include: { company: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.event.findMany({
        where: {
          type: 'task',
          completed: false,
          dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        },
        include: { company: true, deal: true },
        orderBy: { dueDate: 'asc' },
        take: 5 // Limit to 5 for compact dashboard
      })
    ]);

    const totalDealValue = dealsData.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const activeDeals = dealsData.filter(d => !['Won', 'Lost'].includes(d.stage));
    const wonDeals = dealsData.filter(d => d.stage === 'Won');

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companiesCount}</div>
              <p className="text-xs text-gray-500 mt-1">🏢 Companies in CRM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDeals.length}</div>
              <p className="text-xs text-gray-500 mt-1">💼 In pipeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDealValue)}</div>
              <p className="text-xs text-gray-500 mt-1">💰 Total value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Won Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wonDeals.length}</div>
              <p className="text-xs text-gray-500 mt-1">🎉 Closed deals</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📋 Upcoming Tasks</h2>
              <Link href="/tasks">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {tasksData.length > 0 ? (
              <div className="space-y-2">
                {tasksData.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasksData.length === 5 && (
                  <Link href="/tasks">
                    <Card className="p-3 hover:bg-gray-50 transition-colors cursor-pointer text-center">
                      <p className="text-sm text-blue-600 font-medium">View all tasks →</p>
                    </Card>
                  </Link>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <p>No upcoming tasks</p>
                <Link href="/tasks/new">
                  <Button className="mt-3" size="sm">Create Task</Button>
                </Link>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">🚀 Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/ai-lead-finder">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer h-full">
                  <div className="text-2xl mb-2">🤖</div>
                  <h3 className="font-semibold text-sm">AI Lead Finder</h3>
                  <p className="text-xs text-gray-600 mt-1">Discover companies</p>
                </Card>
              </Link>
              <Link href="/companies/new">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer h-full">
                  <div className="text-2xl mb-2">🏢</div>
                  <h3 className="font-semibold text-sm">Add Company</h3>
                  <p className="text-xs text-gray-600 mt-1">Manual entry</p>
                </Card>
              </Link>
              <Link href="/deals/new">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer h-full">
                  <div className="text-2xl mb-2">💼</div>
                  <h3 className="font-semibold text-sm">New Deal</h3>
                  <p className="text-xs text-gray-600 mt-1">Create opportunity</p>
                </Card>
              </Link>
              <Link href="/sequences/new-from-template">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer h-full">
                  <div className="text-2xl mb-2">📧</div>
                  <h3 className="font-semibold text-sm">AI Sequence</h3>
                  <p className="text-xs text-gray-600 mt-1">Email campaign</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded" />}>
          <SmartSuggestions />
        </Suspense>

        {/* Link to detailed analytics */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">📊 Detailed Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">
                View comprehensive charts, pipeline analysis, and performance metrics
              </p>
            </div>
            <Link href="/analytics">
              <Button>View Analytics →</Button>
            </Link>
          </div>
        </Card>
      </>
    );
  } catch (error) {
    logError('Dashboard error:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">Failed to load dashboard data. Please refresh.</p>
      </div>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        <p className="text-gray-600 mt-1">Your command center for sales activities</p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardMetrics />
      </Suspense>
    </div>
  );
}
