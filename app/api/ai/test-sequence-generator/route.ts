import { NextResponse } from 'next/server';
import { testAIService } from '@/lib/ai/sequence-generator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isWorking = await testAIService();

    if (isWorking) {
      return NextResponse.json({
        success: true,
        message: 'AI service is working correctly',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'AI service test failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('AI service test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'AI service test error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
