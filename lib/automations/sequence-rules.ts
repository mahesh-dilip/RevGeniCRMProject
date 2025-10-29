import { prisma } from '@/lib/prisma';

export async function pauseCompanySequences(
  companyId: string,
  reason: string
) {
  await prisma.sequenceEnrollment.updateMany({
    where: {
      companyId,
      status: 'active',
    },
    data: {
      status: 'paused',
      pauseReason: reason,
    },
  });

  console.log(`⏸️ Paused sequences for company ${companyId}: ${reason}`);
}

export async function resumeCompanySequences(companyId: string) {
  await prisma.sequenceEnrollment.updateMany({
    where: {
      companyId,
      status: 'paused',
      pauseReason: { contains: 'Deal' },
    },
    data: {
      status: 'active',
      pauseReason: null,
    },
  });

  console.log(`▶️ Resumed sequences for company ${companyId}`);
}
