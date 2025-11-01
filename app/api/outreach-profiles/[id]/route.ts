import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { logError } from '@/lib/logging';

export const dynamic = 'force-dynamic';

// GET /api/outreach-profiles/[id] - Get single profile
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getAuthContext();
    const { id } = params;

    const profile = await prisma.outreachProfile.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    logError('Error fetching outreach profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outreach profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/outreach-profiles/[id] - Update profile
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getAuthContext();
    const { id } = params;
    const body = await request.json();

    // Verify profile exists and belongs to tenant
    const existing = await prisma.outreachProfile.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (body.isDefault && !existing.isDefault) {
      await prisma.outreachProfile.updateMany({
        where: {
          tenantId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const profile = await prisma.outreachProfile.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        companyOffering: body.companyOffering,
        valueProposition: body.valueProposition,
        targetPainPoints: body.targetPainPoints,
        keyDifferentiators: body.keyDifferentiators,
        successStories: body.successStories,
        tone: body.tone,
        ctaPreference: body.ctaPreference,
        isDefault: body.isDefault,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    logError('Error updating outreach profile:', error);
    return NextResponse.json(
      { error: 'Failed to update outreach profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/outreach-profiles/[id] - Delete profile
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getAuthContext();
    const { id } = params;

    // Verify profile exists and belongs to tenant
    const existing = await prisma.outreachProfile.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    await prisma.outreachProfile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Error deleting outreach profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete outreach profile' },
      { status: 500 }
    );
  }
}
