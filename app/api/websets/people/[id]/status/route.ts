import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';

/**
 * Map Exa WebsetStatus to our internal status
 * Exa uses: idle, pending, running, paused
 * We use: completed, pending, processing, failed
 */
function mapExaStatus(exaStatus: string): string {
  switch (exaStatus) {
    case 'idle':
      return 'completed';
    case 'pending':
      return 'pending';
    case 'running':
      return 'processing';
    case 'paused':
      return 'processing';
    default:
      return exaStatus;
  }
}

/**
 * GET /api/websets/people/[id]/status
 * Check the status of a people webset
 *
 * Security:
 * - Requires authentication (Clerk)
 * - Multi-tenant isolated (only show websets belonging to user's tenant)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId, userId } = await getAuthContext();

    const websetId = params.id;

    // Find webset and verify it belongs to user's tenant
    const webset = await prisma.webset.findFirst({
      where: {
        id: websetId,
        tenantId, // Multi-tenancy: only show websets from same tenant
        type: 'person', // Ensure it's a people webset
      },
    });

    if (!webset) {
      return NextResponse.json(
        { error: 'People webset not found or access denied' },
        { status: 404 }
      );
    }

    // If webset is already completed or failed, return cached status
    if (webset.status === 'completed' || webset.status === 'failed') {
      return NextResponse.json({
        id: webset.id,
        exaId: webset.exaId,
        status: webset.status,
        resultCount: webset.resultCount,
        completedAt: webset.completedAt,
        createdAt: webset.createdAt,
      });
    }

    // For pending/processing websets, check current status from Exa
    try {
      const exaService = new ExaWebsetsService();
      const exaStatus = await exaService.checkStatus(webset.exaId);

      // Map Exa status to our internal status
      const mappedStatus = mapExaStatus(String(exaStatus.status));

      // Update local status if changed
      if (mappedStatus !== webset.status) {
        const updatedWebset = await prisma.webset.update({
          where: { id: webset.id },
          data: {
            status: mappedStatus,
            ...(mappedStatus === 'completed' && {
              completedAt: new Date(),
            }),
          },
        });

        logInfo('People webset status updated', {
          websetId: webset.id,
          oldStatus: webset.status,
          newStatus: mappedStatus,
          exaWebsetStatus: exaStatus.status,
          allSearchesCompleted: exaStatus.allSearchesCompleted,
          tenantId,
        });

        return NextResponse.json({
          id: updatedWebset.id,
          exaId: updatedWebset.exaId,
          status: updatedWebset.status,
          resultCount: updatedWebset.resultCount,
          completedAt: updatedWebset.completedAt,
          createdAt: updatedWebset.createdAt,
          // IMPORTANT: Include search completion status for progressive loading
          searchesComplete: exaStatus.allSearchesCompleted,
          exaWebsetStatus: exaStatus.status,
        });
      }

      return NextResponse.json({
        id: webset.id,
        exaId: webset.exaId,
        status: webset.status,
        resultCount: webset.resultCount,
        completedAt: webset.completedAt,
        createdAt: webset.createdAt,
        // IMPORTANT: Include search completion status for progressive loading
        searchesComplete: exaStatus.allSearchesCompleted,
        exaWebsetStatus: exaStatus.status,
      });
    } catch (exaError) {
      // If Exa API fails, return cached status
      logError('Error checking Exa people webset status', exaError, {
        websetId: webset.id,
        exaId: webset.exaId,
      });

      return NextResponse.json({
        id: webset.id,
        exaId: webset.exaId,
        status: webset.status,
        resultCount: webset.resultCount,
        completedAt: webset.completedAt,
        createdAt: webset.createdAt,
        warning: 'Using cached status due to API error',
      });
    }
  } catch (error) {
    logError('Error fetching people webset status', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch people webset status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
