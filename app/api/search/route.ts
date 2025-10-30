import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        companies: [],
        people: [],
        deals: []
      });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search companies
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { website: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Search people
    const people = await prisma.person.findMany({
      where: {
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

    // Search deals
    const deals = await prisma.deal.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: { company: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      companies,
      people,
      deals
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

