import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';

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
        take: 10
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
            <h2 className="text-xl font-semibold mb-4">📋 Upcoming Tasks</h2>
            {tasksData.length > 0 ? (
              <div className="space-y-2">
                {tasksData.map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                        {task.company && (
                          <p className="text-xs text-gray-600">{task.company.name}</p>
                        )}
                      </div>
                      {task.priority && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <p>No upcoming tasks</p>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">🚀 Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/ai-lead-finder">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="font-semibold">🤖 Find New Leads with AI</h3>
                  <p className="text-sm text-gray-600">Use AI to discover companies matching your criteria</p>
                </Card>
              </Link>
              <Link href="/companies">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="font-semibold">🏢 View Companies</h3>
                  <p className="text-sm text-gray-600">Manage your leads and customers</p>
                </Card>
              </Link>
              <Link href="/deals">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="font-semibold">💼 View Pipeline</h3>
                  <p className="text-sm text-gray-600">Track deals through your sales process</p>
                </Card>
              </Link>
              <Link href="/sequences">
                <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="font-semibold">📧 Email Sequences</h3>
                  <p className="text-sm text-gray-600">Set up automated email campaigns</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
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
