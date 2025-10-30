import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check if sequence exists and is active
    const sequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
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

    // Check if company is already enrolled
    const existingEnrollment = await prisma.sequenceEnrollment.findFirst({
      where: {
        sequenceId: params.id,
        companyId,
        status: { in: ['active', 'paused'] }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Company is already enrolled in this sequence' },
        { status: 400 }
      );
    }

    // Get company info for personalization
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { people: true }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
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

      // Use first person's name if available
      if (company.people.length > 0) {
        const person = company.people[0];
        subject = subject.replace(/\{\{firstName\}\}/g, person.firstName || '');
        subject = subject.replace(/\{\{lastName\}\}/g, person.lastName || '');
        body = body.replace(/\{\{firstName\}\}/g, person.firstName || '');
        body = body.replace(/\{\{lastName\}\}/g, person.lastName || '');
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

    // Return enrollment with scheduled emails
    const enrollmentWithEmails = await prisma.sequenceEnrollment.findUnique({
      where: { id: enrollment.id },
      include: {
        sequence: true,
        company: true,
        scheduledEmails: { orderBy: { scheduledFor: 'asc' } }
      }
    });

    return NextResponse.json(enrollmentWithEmails);
  } catch (error) {
    console.error('Error enrolling in sequence:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in sequence' },
      { status: 500 }
    );
  }
}

