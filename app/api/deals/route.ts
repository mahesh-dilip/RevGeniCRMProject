import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onDealCreated } from '@/lib/automations/triggers';
import { createGetHandler, createPostHandler } from '@/lib/middleware/api-wrapper';
import { CreateDealSchema } from '@/lib/validations/api';

export const GET = createGetHandler({
  permission: 'VIEW_ALL_DATA',
  handler: async ({ auth, request }) => {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where: any = { tenantId: auth.tenantId };
    if (companyId) {
      where.companyId = companyId;
    }

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        primaryContact: true,
      },
    });

    return NextResponse.json(deals);
  },
});

export const POST = createPostHandler({
  schema: CreateDealSchema,
  permission: 'CREATE_DEAL',
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

    // If primary contact is specified, verify it belongs to tenant
    if (data.primaryContactId) {
      const contact = await prisma.person.findFirst({
        where: { id: data.primaryContactId, tenantId: auth.tenantId },
      });

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        );
      }
    }

    const deal = await prisma.deal.create({
      data: {
        tenantId: auth.tenantId,
        title: data.title,
        value: data.value,
        stage: data.stage || 'Prospecting',
        probability: data.probability,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        description: data.description,
        nextAction: data.nextAction,
        lostReason: data.lostReason,
        companyId: data.companyId,
        primaryContactId: data.primaryContactId,
        stageChangedAt: new Date()
      },
      include: {
        company: true,
        primaryContact: true,
      },
    });

    // Create initial event with tenant isolation
    await prisma.event.create({
      data: {
        tenantId: auth.tenantId,
        type: 'note',
        title: `Deal created in ${deal.stage} stage`,
        description: `New deal "${deal.title}" created with ${deal.company.name}`,
        source: 'automation',
        companyId: deal.companyId,
        dealId: deal.id,
      },
    });

    // Trigger automations
    await onDealCreated(deal.id);

    return NextResponse.json(deal);
  },
});
