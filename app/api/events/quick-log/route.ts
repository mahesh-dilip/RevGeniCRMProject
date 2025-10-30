import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPostHandler } from '@/lib/middleware/api-wrapper';
import { QuickLogEventSchema } from '@/lib/validations/api';

export const POST = createPostHandler({
  schema: QuickLogEventSchema,
  permission: 'CREATE_EVENT',
  handler: async (data, { auth }) => {
    // If companyId is provided, verify it belongs to user's tenant
    if (data.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: data.companyId, tenantId: auth.tenantId },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
    }

    const event = await prisma.event.create({
      data: {
        tenantId: auth.tenantId,
        type: data.type,
        title: data.title,
        description: data.description,
        source: 'manual',
        companyId: data.companyId,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(event);
  },
});
