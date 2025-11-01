import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { logError } from '@/lib/logging';

export const dynamic = 'force-dynamic';

// GET /api/outreach-profiles - List all profiles for the tenant
export async function GET() {
  try {
    const { tenantId } = await getAuthContext();

    const profiles = await prisma.outreachProfile.findMany({
      where: { tenantId },
      orderBy: [
        { isDefault: 'desc' }, // Default profile first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(profiles);
  } catch (error) {
    logError('Error fetching outreach profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outreach profiles' },
      { status: 500 }
    );
  }
}

// POST /api/outreach-profiles - Create new profile
export async function POST(request: Request) {
  try {
    const { tenantId } = await getAuthContext();
    const body = await request.json();

    const {
      name,
      description,
      companyOffering,
      valueProposition,
      targetPainPoints,
      keyDifferentiators,
      successStories,
      tone,
      ctaPreference,
      isDefault,
    } = body;

    // Validate required fields
    if (!name || !companyOffering || !valueProposition || !ctaPreference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.outreachProfile.updateMany({
        where: {
          tenantId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const profile = await prisma.outreachProfile.create({
      data: {
        tenantId,
        name,
        description,
        companyOffering,
        valueProposition,
        targetPainPoints: targetPainPoints || [],
        keyDifferentiators: keyDifferentiators || [],
        successStories: successStories || [],
        tone: tone || 'professional',
        ctaPreference,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    logError('Error creating outreach profile:', error);
    return NextResponse.json(
      { error: 'Failed to create outreach profile' },
      { status: 500 }
    );
  }
}
