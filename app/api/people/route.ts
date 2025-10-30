import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGetHandler, createPostHandler } from '@/lib/middleware/api-wrapper';
import { CreatePersonSchema } from '@/lib/validations/api';

export const GET = createGetHandler({
  permission: 'VIEW_ALL_DATA',
  handler: async ({ auth, request }) => {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where: any = { tenantId: auth.tenantId };
    if (companyId) {
      where.companyId = companyId;
    }

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
  },
});

export const POST = createPostHandler({
  schema: CreatePersonSchema,
  permission: 'CREATE_PERSON',
  handler: async (data, { auth }) => {
    // Verify company belongs to user's tenant
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, tenantId: auth.tenantId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const person = await prisma.person.create({
      data: {
        tenantId: auth.tenantId,
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
  },
});
