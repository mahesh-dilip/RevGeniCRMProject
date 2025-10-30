import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { validateRequest } from '@/lib/middleware/validate';
import { logError } from '@/lib/logging';

import { EnrollSequenceSchema } from '@/lib/validations/sequences';
import { rateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit-memory';
import { getAuthContext, requireRole } from '@/lib/auth/context';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context and check permissions
    const { tenantId, role } = await getAuthContext();
    requireRole(role, 'MANAGER'); // Enrolling in sequences requires MANAGER role or higher

    // Rate limiting - Email sequence enrollment can trigger many scheduled emails
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 'bulk');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Too many sequence enrollments.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
          },
        }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, EnrollSequenceSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { companyId, contactId, enrollments } = validation.data;

    // Support both single and bulk enrollment
    const enrollmentList = enrollments || (companyId ? [{ companyId, contactId: contactId || null }] : []);

    // Check if sequence exists, is active, and belongs to tenant
    const sequence = await prisma.emailSequence.findFirst({
      where: { id: params.id, tenantId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } }
    });

    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }

    if (!sequence.active) {
      return NextResponse.json(
        { error: 'Cannot enroll in inactive sequence' },
        { status: 400 }
      );
    }

    const results = {
      enrolled: [] as any[],
      skipped: [] as string[],
      errors: [] as string[]
    };

    // Process each enrollment
    for (const { companyId, contactId } of enrollmentList) {
      try {
        // Check if company is already enrolled
        const existingEnrollment = await prisma.sequenceEnrollment.findFirst({
          where: {
            sequenceId: params.id,
            companyId,
            status: { in: ['active', 'paused'] }
          }
        });

        if (existingEnrollment) {
          results.skipped.push(companyId);
          continue;
        }

        // Get company info for personalization (must belong to same tenant)
        const company = await prisma.company.findFirst({
          where: { id: companyId, tenantId },
          include: { people: true }
        });

        if (!company) {
          results.errors.push(`Company ${companyId} not found`);
          continue;
        }

        // Get the selected contact for personalization
        let selectedPerson = null;
        if (contactId) {
          selectedPerson = company.people.find(p => p.id === contactId);
        }
        // Fallback to first person if no contact selected
        if (!selectedPerson && company.people.length > 0) {
          selectedPerson = company.people[0];
        }

        // Create enrollment
        const enrollment = await prisma.sequenceEnrollment.create({
          data: {
            sequenceId: params.id,
            companyId,
            status: 'active',
            currentStep: 0
          }
        });

        // Schedule emails for all steps
        const now = new Date();
        const scheduledEmails = [];

        for (const step of sequence.steps) {
          const scheduledFor = addDays(now, step.delayDays);

          // Simple variable replacement
          let subject = step.subject;
          let body = step.body;

          if (company.name) {
            subject = subject.replace(/\{\{company\}\}/g, company.name);
            body = body.replace(/\{\{company\}\}/g, company.name);
          }

          if (company.website) {
            body = body.replace(/\{\{website\}\}/g, company.website);
          }

          // Use selected person's details for personalization
          if (selectedPerson) {
            subject = subject.replace(/\{\{firstName\}\}/g, selectedPerson.firstName || '');
            subject = subject.replace(/\{\{lastName\}\}/g, selectedPerson.lastName || '');
            body = body.replace(/\{\{firstName\}\}/g, selectedPerson.firstName || '');
            body = body.replace(/\{\{lastName\}\}/g, selectedPerson.lastName || '');
          }

          scheduledEmails.push({
            enrollmentId: enrollment.id,
            stepOrder: step.stepOrder,
            subject,
            body,
            scheduledFor,
            status: 'scheduled'
          });
        }

        // Bulk create scheduled emails
        if (scheduledEmails.length > 0) {
          await prisma.scheduledEmail.createMany({
            data: scheduledEmails
          });
        }

        results.enrolled.push(enrollment);
      } catch (error) {
        logError(`Error enrolling company ${companyId}:`, error);
        results.errors.push(`Failed to enroll company ${companyId}`);
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      enrolled: results.enrolled.length,
      skipped: results.skipped.length,
      errors: results.errors,
      data: results.enrolled
    });
  } catch (error) {
    logError('Error enrolling in sequence:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in sequence' },
      { status: 500 }
    );
  }
}

