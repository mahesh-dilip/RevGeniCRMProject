import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGetHandler, createPostHandler } from '@/lib/middleware/api-wrapper';
import { CreateCompanySchema } from '@/lib/validations/api';

export const GET = createGetHandler({
  permission: 'VIEW_ALL_DATA',
  handler: async ({ auth, request }) => {
    const { searchParams } = new URL(request.url);
    const includePeople = searchParams.get('includePeople') === 'true';

    // Tenant isolation: only fetch companies for user's tenant
    const companies = await prisma.company.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        ...(includePeople && { people: true }),
        _count: {
          select: {
            deals: true,
            people: true,
          },
        },
      },
    });

    return NextResponse.json(companies);
  },
});

export const POST = createPostHandler({
  schema: CreateCompanySchema,
  permission: 'CREATE_COMPANY',
  handler: async (data, { auth }) => {
    const company = await prisma.company.create({
      data: {
        tenantId: auth.tenantId,
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        geography: data.geography,
        status: data.status || 'Lead',
        description: data.description,
        foundedYear: data.foundedYear,
        sourceType: data.sourceType || 'manual',
        sourceQuery: data.sourceQuery,
        confidence: data.confidence,
      },
    });

    return NextResponse.json(company);
  },
});
