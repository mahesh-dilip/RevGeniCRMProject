import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { validateRequest, EnrollSequenceSchema } from '@/lib/validations/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const authContext = await getAuthContext();
    
    // 2. Rate limiting (sequence enrollments are expensive)
    const rateLimitResponse = await rateLimit(authContext.userId, 'sequences');
    if (rateLimitResponse) return rateLimitResponse;
    
    // 3. Authorization
    requirePermission(authContext, 'ENROLL_SEQUENCE');

    const { id } = await params;
    const body = await validateRequest(request, EnrollSequenceSchema);
    const { companyId, contactId, enrollments } = body;

    // Support both single and bulk enrollment
    const enrollmentList = enrollments || (companyId ? [{ companyId, contactId: contactId || null }] : []);

    if (enrollmentList.length === 0) {
      return NextResponse.json(
        { error: 'At least one company is required' },
        { status: 400 }
      );
    }

    // Check if sequence exists and is active
    const sequence = await prisma.emailSequence.findUnique({
      where: { id },
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
        // Verify company belongs to user's tenant
        const company = await prisma.company.findFirst({
          where: { id: companyId, tenantId: authContext.tenantId },
          include: { people: true }
        });

        if (!company) {
          results.errors.push(`Company ${companyId} not found`);
          continue;
        }

        // Check if company is already enrolled
        const existingEnrollment = await prisma.sequenceEnrollment.findFirst({
          where: {
            sequenceId: id,
            companyId,
            status: { in: ['active', 'paused'] }
          }
        });

        if (existingEnrollment) {
          results.skipped.push(companyId);
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
            sequenceId: id,
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
        console.error(`Error enrolling company ${companyId}:`, error);
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
    console.error('Error enrolling in sequence:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 
                   error instanceof Error && error.message.includes('Validation') ? 400 : 
                   error instanceof Error && error.message.includes('Rate limit') ? 429 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enroll in sequence' },
      { status }
    );
  }
}

