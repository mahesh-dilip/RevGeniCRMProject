import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { DEAL_STAGES } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json({
      totalDealValue,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      closedDeals,
      winRate,
      avgDealValue,
      totalCompanies: companies.length,
      customers: companiesByStatus['Customer'] || 0,
      leadToCustomerRate,
      companyToDealRate,
      companiesWithDeals,
      totalEnrollments,
      activeSequences,
      dealsByStage,
      companiesByStatus,
      aiGenerated,
      manual,
      activityBreakdown,
      monthlyTrend,
      totalDeals: deals.length
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
