import { prisma } from '@/lib/prisma';

interface ScoringFactors {
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  dealCount: number;
  dealValue: number;
  eventCount: number;
  recentActivity: boolean; // Activity in last 7 days
  emailEngagement: number; // Opens + clicks
  aiConfidence?: number;
  companySize?: string;
  industry?: string;
}

export function calculateLeadScore(factors: ScoringFactors): number {
  let score = 0;

  // Contact completeness (20 points max)
  if (factors.hasEmail) score += 10;
  if (factors.hasPhone) score += 5;
  if (factors.hasLinkedIn) score += 5;

  // Deal activity (30 points max)
  score += Math.min(factors.dealCount * 5, 15);
  if (factors.dealValue > 0) {
    score += Math.min(Math.floor(factors.dealValue / 10000), 15);
  }

  // Engagement (30 points max)
  score += Math.min(factors.eventCount * 2, 15);
  if (factors.recentActivity) score += 10;
  score += Math.min(factors.emailEngagement, 5);

  // Company quality (20 points max)
  if (factors.aiConfidence) {
    score += Math.floor(factors.aiConfidence * 10);
  }
  if (factors.companySize) {
    // Bigger companies score higher
    if (factors.companySize.includes('200+') || factors.companySize.includes('500+')) {
      score += 5;
    } else if (factors.companySize.includes('50-200')) {
      score += 3;
    }
  }
  if (factors.industry) {
    // High-value industries
    const highValueIndustries = ['saas', 'fintech', 'enterprise software', 'technology'];
    if (highValueIndustries.some(ind => factors.industry?.toLowerCase().includes(ind))) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

export async function updateCompanyLeadScore(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      people: true,
      deals: true,
      events: { where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }
    }
  });

  if (!company) return;

  const hasEmail = company.people.some(p => p.email);
  const hasPhone = company.people.some(p => p.phone);
  const hasLinkedIn = company.people.some(p => p.linkedin);
  const dealValue = company.deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const recentActivity = company.events.length > 0;

  const score = calculateLeadScore({
    hasEmail,
    hasPhone,
    hasLinkedIn,
    dealCount: company.deals.length,
    dealValue,
    eventCount: company.events.length,
    recentActivity,
    emailEngagement: (company.emailOpens || 0) + (company.emailClicks || 0),
    aiConfidence: company.confidence || undefined,
    companySize: company.size || undefined,
    industry: company.industry || undefined
  });

  await prisma.company.update({
    where: { id: companyId },
    data: { leadScore: score }
  });

  return score;
}
