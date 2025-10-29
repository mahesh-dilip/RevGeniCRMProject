import { prisma } from '@/lib/prisma';

export async function checkForDuplicate(
  website?: string,
  name?: string
): Promise<boolean> {
  if (!website && !name) return false;

  const conditions = [];

  if (website) {
    const normalizedWebsite = website
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, '');
    conditions.push({
      website: {
        contains: normalizedWebsite,
        mode: 'insensitive' as const,
      },
    });
  }

  if (name) {
    conditions.push({
      name: {
        equals: name,
        mode: 'insensitive' as const,
      },
    });
  }

  const existing = await prisma.company.findFirst({
    where: { OR: conditions },
  });

  return !!existing;
}
