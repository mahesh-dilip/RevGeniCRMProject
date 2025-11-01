import { NextResponse } from 'next/server';
import { getAllTemplates, getTemplateById } from '@/lib/constants/sequence-templates';

export const dynamic = 'force-dynamic';

// GET /api/sequence-templates
// Query params:
//   - id: Get specific template by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const template = getTemplateById(id);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }

    // Return all templates
    const templates = getAllTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching sequence templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequence templates' },
      { status: 500 }
    );
  }
}
