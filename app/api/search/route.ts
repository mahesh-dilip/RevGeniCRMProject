import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGetHandler } from '@/lib/middleware/api-wrapper';

export const GET = createGetHandler({
  permission: 'VIEW_ALL_DATA',
  handler: async ({ auth, request }) => {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return {
        companies: [],
        people: [],
        deals: []
      };
    }

    const searchTerm = query.trim().toLowerCase();

    // Search companies - WITH TENANT ISOLATION
    const companies = await prisma.company.findMany({
      where: {
        tenantId: auth.tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { website: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Search people - WITH TENANT ISOLATION
    const people = await prisma.person.findMany({
      where: {
        tenantId: auth.tenantId,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { title: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: { company: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Search deals - WITH TENANT ISOLATION
    const deals = await prisma.deal.findMany({
      where: {
        tenantId: auth.tenantId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: { company: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return {
      companies,
      people,
      deals
    };
  },
});

