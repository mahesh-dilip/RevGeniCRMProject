import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

// Update enrollment status (pause/resume/unenroll)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getAuthContext();
    const body = await request.json();
    const { status, pauseReason } = body;

    // Validate status
    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, paused, completed, or cancelled' },
        { status: 400 }
      );
    }

    // Verify enrollment exists and belongs to tenant
    const enrollment = await prisma.sequenceEnrollment.findFirst({
      where: {
        id: params.id,
        company: { tenantId }
      },
      include: {
        company: true,
        scheduledEmails: true
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // If pausing, optionally cancel scheduled emails
    if (status === 'paused' && enrollment.scheduledEmails.length > 0) {
      await prisma.scheduledEmail.updateMany({
        where: {
          enrollmentId: params.id,
          status: 'scheduled'
        },
        data: {
          status: 'cancelled'
        }
      });
    }

    // If resuming, recreate scheduled emails
    if (status === 'active' && enrollment.status === 'paused') {
      // Get the sequence steps
      const sequence = await prisma.emailSequence.findUnique({
        where: { id: enrollment.sequenceId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } }
      });

      if (sequence) {
        // Cancel any existing scheduled emails
        await prisma.scheduledEmail.updateMany({
          where: {
            enrollmentId: params.id,
            status: 'scheduled'
          },
          data: {
            status: 'cancelled'
          }
        });

        // Create new scheduled emails from current step onwards
        const remainingSteps = sequence.steps.filter(
          step => step.stepOrder >= enrollment.currentStep
        );

        const scheduledEmails = remainingSteps.map((step, index) => {
          const delayFromNow = index === 0
            ? 0 // Send next email immediately if resuming
            : remainingSteps.slice(0, index).reduce((sum, s) => sum + s.delayDays, 0);

          const scheduledFor = new Date();
          scheduledFor.setDate(scheduledFor.getDate() + delayFromNow);

          return {
            enrollmentId: params.id,
            stepOrder: step.stepOrder,
            scheduledFor,
            subject: step.subject,
            body: step.body
          };
        });

        if (scheduledEmails.length > 0) {
          await prisma.scheduledEmail.createMany({
            data: scheduledEmails
          });
        }
      }
    }

    // Update the enrollment
    const updated = await prisma.sequenceEnrollment.update({
      where: { id: params.id },
      data: {
        status,
        ...(pauseReason && { pauseReason })
      },
      include: {
        company: true,
        scheduledEmails: {
          orderBy: { scheduledFor: 'asc' }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logError('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}

// Delete (unenroll) from sequence
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getAuthContext();

    // Verify enrollment exists and belongs to tenant
    const enrollment = await prisma.sequenceEnrollment.findFirst({
      where: {
        id: params.id,
        company: { tenantId }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Delete the enrollment (cascade will handle scheduled emails)
    await prisma.sequenceEnrollment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    logError('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
