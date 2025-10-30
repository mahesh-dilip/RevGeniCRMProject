import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const deal = await prisma.deal.create({
      data: {
        title: `Deal with ${company.name}`,
        stage: 'Prospecting',
        companyId: company.id,
      },
      include: {
        company: true,
      },
    });

    await prisma.company.update({
      where: { id: company.id },
      data: { status: 'Qualified' },
    });

    await prisma.event.create({
      data: {
        type: 'note',
        title: 'Deal created from lead',
        description: `Converted ${company.name} to a deal opportunity`,
        source: 'manual',
        companyId: company.id,
        dealId: deal.id,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error converting to deal:', error);
    return NextResponse.json(
      { error: 'Failed to convert to deal' },
      { status: 500 }
    );
  }
}
