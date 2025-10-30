import { logError } from '@/lib/logging';

import Anthropic from '@anthropic-ai/sdk';
import Exa from 'exa-js';
import { withRetry } from '@/lib/utils/retry';
import { LeadResultSchema, type ValidatedLeadResult } from './validators';

function getExa() {
  return new Exa(process.env.EXA_API_KEY || '');
}

function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
}

export interface LeadCriteria {
  industry: string;
  geography: string;
  size: string;
  additionalContext?: string;
}

export interface LeadResult {
  name: string;
  website: string;
  industry: string;
  size: string;
  geography: string;
  description: string;
  foundedYear?: number | null;
  confidence: number;
}

/**
 * Main function to find leads using AI with retry logic
 */
export async function findLeads(
  criteria: LeadCriteria,
  maxResults: number = 10
): Promise<LeadResult[]> {
  console.log('🔍 Starting lead search with criteria:', criteria);

  // Step 1: Build Exa search query
  const searchQuery = buildSearchQuery(criteria);
  console.log('📝 Search query:', searchQuery);

  // Step 2: Search with Exa (with retry)
  const exaResults = await withRetry(
    async () => {
      const exa = getExa();
      return await exa.searchAndContents(searchQuery, {
        type: 'neural',
        numResults: maxResults * 2,
        text: true,
      });
    },
    3,
    1000
  );

  console.log(`📊 Found ${exaResults.results.length} raw results`);

  // Step 3: Extract structured data with AI (parallel with retry)
  const leadPromises = exaResults.results.slice(0, maxResults).map((result) =>
    withRetry(
      () => extractLeadData(result, criteria),
      2,
      500
    )
  );

  const leads = await Promise.all(leadPromises);

  // Step 4: Filter and rank by confidence
  const filteredLeads = leads
    .filter((lead) => lead.confidence > 0.6)
    .sort((a, b) => b.confidence - a.confidence);

  console.log(`✅ Returning ${filteredLeads.length} high-confidence leads`);

  return filteredLeads;
}

/**
 * Build search query from criteria
 */
function buildSearchQuery(criteria: LeadCriteria): string {
  const parts = [];

  if (criteria.industry) parts.push(criteria.industry);
  if (criteria.geography) parts.push(`in ${criteria.geography}`);
  if (criteria.size) parts.push(`with ${criteria.size} employees`);
  parts.push('companies');
  if (criteria.additionalContext) parts.push(criteria.additionalContext);

  return parts.join(' ');
}

/**
 * Extract structured lead data using Claude with robust parsing
 */
async function extractLeadData(
  exaResult: any,
  criteria: LeadCriteria
): Promise<LeadResult> {
  const prompt = `Extract company information from this search result.

Search Result:
Title: ${exaResult.title}
URL: ${exaResult.url}
Content: ${exaResult.text?.substring(0, 2000) || 'No content available'}

Target Criteria:
- Industry: ${criteria.industry}
- Geography: ${criteria.geography}
- Size: ${criteria.size}

Extract and return ONLY a JSON object with these exact fields:
{
  "name": "Company name (string)",
  "website": "Full website URL (string)",
  "industry": "Specific industry (string)",
  "size": "Employee count or range (string)",
  "geography": "Location - city, country (string)",
  "description": "1-2 sentence company description (string)",
  "foundedYear": 2020 (number or null),
  "confidence": 0.85 (number between 0-1, how well this matches ALL criteria)
}

Rules:
- Return ONLY valid JSON, no markdown, no other text
- All string fields must be strings, not null
- foundedYear must be a number or null
- confidence must be 0-1 decimal
- Confidence should be lower if information is missing or doesn't match criteria
- If unsure about data, reduce confidence accordingly`;

  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      let parsed = tryParseJSON(content.text);
      if (!parsed) {
        parsed = tryExtractJSON(content.text);
      }

      if (parsed) {
        const validated = LeadResultSchema.parse(parsed);
        return validated;
      }
    }
  } catch (error) {
    logError('Error extracting lead data:', error);
  }

  return createFallbackLead(exaResult, criteria);
}

/**
 * Try to parse JSON directly
 */
function tryParseJSON(text: string): any | null {
  try {
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

/**
 * Try to extract JSON using regex
 */
function tryExtractJSON(text: string): any | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Create fallback lead with low confidence
 */
function createFallbackLead(exaResult: any, criteria: LeadCriteria): LeadResult {
  return {
    name: exaResult.title || 'Unknown Company',
    website: exaResult.url,
    industry: criteria.industry,
    size: criteria.size,
    geography: criteria.geography,
    description: exaResult.text?.substring(0, 200) || 'No description available',
    confidence: 0.4,
  };
}
