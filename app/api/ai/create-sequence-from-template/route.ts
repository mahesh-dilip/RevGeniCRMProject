import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { logError } from '@/lib/logging';
import { generateEmailSequence } from '@/lib/ai/sequence-generator';
import { getTemplateById } from '@/lib/constants/sequence-templates';

export const dynamic = 'force-dynamic';

interface CreateSequenceRequest {
  templateId: string;
  profileId: string;
  sequenceName: string;
  sequenceDescription?: string;
  sampleCompanyId: string; // Company to use for preview generation
  samplePersonId?: string;
  customInstructions?: string;
}

/**
 * POST /api/ai/create-sequence-from-template
 * Creates a new EmailSequence in the database using AI-generated content
 * Uses a sample company to generate preview emails, then saves them as a template sequence
 */
export async function POST(request: Request) {
  try {
    const { tenantId } = await getAuthContext();
    const body: CreateSequenceRequest = await request.json();

    const {
      templateId,
      profileId,
      sequenceName,
      sequenceDescription,
      sampleCompanyId,
      samplePersonId,
      customInstructions,
    } = body;

    // Validate required fields
    if (!templateId || !profileId || !sequenceName || !sampleCompanyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      where: { id: profileId, tenantId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Outreach profile not found' },
        { status: 404 }
      );
    }

    // Fetch sample company for generation
    const company = await prisma.company.findFirst({
      where: { id: sampleCompanyId, tenantId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Sample company not found' },
        { status: 404 }
      );
    }

    // Fetch person if provided, otherwise get first contact
    let person = null;
    if (samplePersonId) {
      person = await prisma.person.findFirst({
        where: { id: samplePersonId, tenantId, companyId: sampleCompanyId },
      });
    }

    if (!person) {
      person = await prisma.person.findFirst({
        where: { companyId: sampleCompanyId, tenantId },
        orderBy: { createdAt: 'asc' },
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

    // Create the EmailSequence in the database
    const sequence = await prisma.emailSequence.create({
      data: {
        tenantId,
        name: sequenceName,
        description: sequenceDescription || `AI-generated sequence based on ${template.name}`,
        active: true,
        pauseOnDealCreation: true,
        pauseOnDealStages: ['Won', 'Lost'],
        steps: {
          create: generatedEmails.map((email, index) => ({
            stepOrder: index + 1,
            delayDays: template.emails[index].delayDays,
            subject: email.subject,
            body: email.body,
          })),
        },
      },
      include: {
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sequence,
      generationMetadata: {
        template: {
          id: template.id,
          name: template.name,
        },
        profile: {
          id: profile.id,
          name: profile.name,
        },
        sampleCompany: {
          id: company.id,
          name: company.name,
        },
        samplePerson: person
          ? {
              id: person.id,
              name: `${person.firstName} ${person.lastName}`,
            }
          : null,
      },
    });
  } catch (error) {
    logError('Error creating sequence from template:', error);
    return NextResponse.json(
      {
        error: 'Failed to create sequence from template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
