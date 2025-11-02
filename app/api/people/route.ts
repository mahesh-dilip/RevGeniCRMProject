import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { CreatePersonSchema } from '@/lib/validations/people';
import { logError } from '@/lib/logging';

import { getAuthContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { tenantId } = await getAuthContext();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where = companyId ? { tenantId, companyId } : { tenantId };

    const people = await prisma.person.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            events: true,
            primaryDeals: true,
          },
        },
      },
    });

    return NextResponse.json(people);
  } catch (error) {
    logError('Error fetching people:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    // Validate request body
    const validation = await validateRequest(request, CreatePersonSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const person = await prisma.person.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        linkedin: data.linkedin,
        companyId: data.companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    logError('Error creating person:', error);
    return NextResponse.json(
      { error: 'Failed to create person' },
      { status: 500 }
    );
  }
}
