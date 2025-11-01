import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { logError } from '@/lib/logging';
import { generateEmailSequence } from '@/lib/ai/sequence-generator';
import { getTemplateById } from '@/lib/constants/sequence-templates';

export const dynamic = 'force-dynamic';

interface GenerateSequenceRequest {
  templateId: string;
  profileId: string;
  companyId: string;
  personId?: string;
  customInstructions?: string;
}

/**
 * POST /api/ai/generate-sequence
 * Generates a personalized email sequence using AI
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getAuthContext();
    const body: GenerateSequenceRequest = await request.json();

    const { templateId, profileId, companyId, personId, customInstructions } = body;

    // Validate required fields
    if (!templateId || !profileId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, profileId, companyId' },
        { status: 400 }
      );
    }

    // Fetch template
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Fetch outreach profile
    const profile = await prisma.outreachProfile.findFirst({
      where: {
        id: profileId,
        tenantId,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Outreach profile not found' },
        { status: 404 }
      );
    }

    // Fetch company
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        tenantId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Fetch person if provided
    let person = null;
    if (personId) {
      person = await prisma.person.findFirst({
        where: {
          id: personId,
          tenantId,
          companyId, // Ensure person belongs to the company
        },
      });
    }

    // If no specific person provided, get the first contact for this company
    if (!person) {
      person = await prisma.person.findFirst({
        where: {
          companyId,
          tenantId,
        },
        orderBy: {
          createdAt: 'asc', // Use oldest/primary contact
        },
      });
    }

    // Build context for AI generation
    const userProfile = {
      id: profile.id,
      name: profile.name,
      companyOffering: profile.companyOffering,
      valueProposition: profile.valueProposition,
      targetPainPoints: (Array.isArray(profile.targetPainPoints)
        ? profile.targetPainPoints
        : []) as string[],
      keyDifferentiators: (Array.isArray(profile.keyDifferentiators)
        ? profile.keyDifferentiators
        : []) as string[],
      successStories: (Array.isArray(profile.successStories)
        ? profile.successStories
        : []) as string[],
      tone: profile.tone as 'formal' | 'casual' | 'technical',
      ctaPreference: profile.ctaPreference,
    };

    const companyContext = {
      name: company.name,
      industry: company.industry || undefined,
      website: company.website || undefined,
      description: company.description || undefined,
      status: company.status,
      leadScore: company.leadScore || undefined,
      sourceQuery: company.sourceQuery || undefined,
      size: company.size || undefined,
      geography: company.geography || undefined,
    };

    const personContext = person
      ? {
          firstName: person.firstName,
          lastName: person.lastName,
          title: person.title || undefined,
          email: person.email || undefined,
        }
      : undefined;

    // Generate the email sequence using AI
    const generatedEmails = await generateEmailSequence({
      userProfile,
      template,
      companyContext,
      personContext,
      customInstructions,
    });

    return NextResponse.json({
      success: true,
      emails: generatedEmails,
      metadata: {
        template: {
          id: template.id,
          name: template.name,
        },
        profile: {
          id: profile.id,
          name: profile.name,
        },
        company: {
          id: company.id,
          name: company.name,
        },
        person: person
          ? {
              id: person.id,
              name: `${person.firstName} ${person.lastName}`,
            }
          : null,
      },
    });
  } catch (error) {
    logError('Error generating email sequence:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate email sequence',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
