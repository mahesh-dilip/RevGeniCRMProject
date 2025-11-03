# Exa Websets Implementation Plan (Security-Compatible)

**Date**: 2025-10-30
**Compatible with**: Phases 1-6 (Validation, Rate Limiting, Auth, Multi-Tenancy, Logging, React Query)

## Overview

Implement Exa Websets for AI-powered company and people discovery, following all security best practices from Phases 1-6.

---

## Part 1: Database Schema Updates

### Add Webset Model with Multi-Tenancy

```prisma
// Add to schema.prisma

model Webset {
  id          String   @id @default(cuid())
  tenantId    String   // Multi-tenancy support
  exaId       String   @unique // Exa's webset ID
  type        String   // 'company' or 'person'
  status      String   // 'pending', 'processing', 'completed', 'failed'
  query       String   // Original search query
  criteria    Json     // Search criteria used
  resultCount Int      @default(0)
  createdBy   String   // User ID who created it
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?

  // Relations
  companies   Company[]
  people      Person[]

  // Indexes
  @@index([tenantId])
  @@index([status])
  @@index([type])
  @@index([createdBy])
}

// Update Company model
model Company {
  // ... existing fields ...

  websetId    String?
  webset      Webset?  @relation(fields: [websetId], references: [id])

  // ... rest of fields ...
}

// Update Person model
model Person {
  // ... existing fields ...

  websetId    String?
  webset      Webset?  @relation(fields: [websetId], references: [id])

  // ... rest of fields ...
}
```

**Migration:**
```bash
npx prisma db push
```

---

## Part 2: Validation Schemas (Phase 1)

### Create Zod Schemas

```typescript
// lib/validation/websets.ts

import { z } from 'zod';

export const createCompanyWebsetSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  geography: z.string().min(1, 'Geography is required'),
  size: z.string().optional(),
  additionalContext: z.string().optional(),
  maxResults: z.number().int().min(1).max(100).default(50)
});

export const createPeopleWebsetSchema = z.object({
  companyNames: z.array(z.string()).optional(),
  jobTitles: z.array(z.string()).optional(),
  seniority: z.array(z.string()).optional(),
  location: z.string().optional(),
  industries: z.array(z.string()).optional(),
  maxResults: z.number().int().min(1).max(100).default(50)
}).refine(
  data =>
    data.companyNames?.length ||
    data.jobTitles?.length ||
    data.industries?.length ||
    data.location,
  { message: 'At least one search criteria is required' }
);

export type CreateCompanyWebsetInput = z.infer<typeof createCompanyWebsetSchema>;
export type CreatePeopleWebsetInput = z.infer<typeof createPeopleWebsetSchema>;
```

---

## Part 3: Exa Websets Service (with Logging)

### Update Service with Structured Logging

```typescript
// lib/ai/exa-websets.ts

import Exa from 'exa-js';
import { logError, logInfo, logWarning } from '@/lib/logging';

export interface CompanySearchParams {
  industry: string;
  geography: string;
  size?: string;
  sizeMin?: number;
  sizeMax?: number;
  additionalContext?: string;
  maxResults?: number;
}

export interface PeopleSearchParams {
  companyNames?: string[];
  jobTitles?: string[];
  seniority?: string[];
  location?: string;
  industries?: string[];
  maxResults?: number;
}

export interface WebsetResult {
  id: string;
  status: string;
  itemCount?: number;
}

export class ExaWebsetsService {
  private exa: Exa;

  constructor() {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error('EXA_API_KEY environment variable is not set');
    }
    this.exa = new Exa(apiKey);
  }

  /**
   * Create a webset to find companies
   */
  async findCompanies(params: CompanySearchParams): Promise<WebsetResult> {
    const {
      industry,
      geography,
      size,
      sizeMin,
      sizeMax,
      additionalContext,
      maxResults = 50
    } = params;

    // Build search query
    let query = `${industry} companies in ${geography}`;
    if (size) {
      query += ` with ${size}`;
    }

    // Build criteria
    const criteria = [
      { description: `Company operates in the ${industry} industry` },
      { description: `Company is located in or headquartered in ${geography}` }
    ];

    if (sizeMin && sizeMax) {
      criteria.push({
        description: `Company has between ${sizeMin} and ${sizeMax} employees`
      });
    } else if (size) {
      criteria.push({
        description: `Company size: ${size}`
      });
    }

    if (additionalContext) {
      criteria.push({
        description: additionalContext
      });
    }

    logInfo('Creating company webset', { query, criteriaCount: criteria.length });

    try {
      const webset = await this.exa.websets.create({
        search: {
          query,
          count: maxResults
        },
        entity: {
          type: 'company'
        },
        criteria,
        enrichments: [
          { description: 'Official company website URL', format: 'text' },
          { description: 'Number of employees', format: 'number' },
          { description: 'Company headquarters location with city and country', format: 'text' },
          { description: 'Primary industry and business model', format: 'text' },
          { description: 'Company description and what they do', format: 'text' },
          { description: 'Year the company was founded', format: 'number' },
          { description: 'Latest funding information if venture-backed', format: 'text' },
          { description: 'Annual revenue range if publicly available', format: 'text' }
        ]
      });

      logInfo('Company webset created', { websetId: webset.id });

      return {
        id: webset.id,
        status: webset.status || 'pending',
        itemCount: 0
      };
    } catch (error) {
      logError('Error creating company webset', error, { query, criteria });
      throw error;
    }
  }

  /**
   * Create a webset to find people/contacts
   */
  async findPeople(params: PeopleSearchParams): Promise<WebsetResult> {
    const {
      companyNames = [],
      jobTitles = [],
      seniority = [],
      location,
      industries = [],
      maxResults = 50
    } = params;

    // Build search query
    let query = 'Business professionals';

    if (companyNames.length > 0) {
      query = `People working at ${companyNames.join(' or ')}`;
    } else if (industries.length > 0) {
      query = `People working in ${industries.join(' or ')} industry`;
    }

    if (jobTitles.length > 0) {
      query += ` with titles like ${jobTitles.join(', ')}`;
    }

    if (location) {
      query += ` in ${location}`;
    }

    // Build criteria
    const criteria = [];

    if (companyNames.length > 0) {
      companyNames.forEach(name => {
        criteria.push({
          description: `Person currently works at ${name}`
        });
      });
    }

    if (industries.length > 0) {
      criteria.push({
        description: `Person works in ${industries.join(' or ')} industry`
      });
    }

    if (jobTitles.length > 0) {
      criteria.push({
        description: `Person has job title or role: ${jobTitles.join(', ')}`
      });
    }

    if (seniority.length > 0) {
      criteria.push({
        description: `Person is at ${seniority.join(' or ')} seniority level`
      });
    }

    if (location) {
      criteria.push({
        description: `Person is located in ${location}`
      });
    }

    logInfo('Creating people webset', { query, criteriaCount: criteria.length });

    try {
      const webset = await this.exa.websets.create({
        search: {
          query,
          count: maxResults
        },
        entity: {
          type: 'person'
        },
        criteria,
        enrichments: [
          { description: 'Full name', format: 'text' },
          { description: 'Professional email address', format: 'contact' },
          { description: 'Phone number', format: 'contact' },
          { description: 'LinkedIn profile URL', format: 'text' },
          { description: 'Current company name', format: 'text' },
          { description: 'Current job title', format: 'text' },
          { description: 'Seniority level (entry, mid, senior, executive)', format: 'text' },
          { description: 'Years of experience in current role', format: 'number' },
          { description: 'Location or city', format: 'text' }
        ]
      });

      logInfo('People webset created', { websetId: webset.id });

      return {
        id: webset.id,
        status: webset.status || 'pending',
        itemCount: 0
      };
    } catch (error) {
      logError('Error creating people webset', error, { query, criteria });
      throw error;
    }
  }

  /**
   * Wait for a webset to complete and get all results
   */
  async getWebsetResults(websetId: string, timeout: number = 600000) {
    logInfo('Waiting for webset to complete', { websetId });

    try {
      const completedWebset = await this.exa.websets.waitUntilIdle(websetId, {
        timeout,
        pollInterval: 5000,
        onPoll: (status) => {
          logInfo('Webset polling', { websetId, status });
        }
      });

      const items = await this.exa.websets.items.getAll(websetId);

      logInfo('Webset results retrieved', { websetId, itemCount: items.length });

      return {
        webset: completedWebset,
        items
      };
    } catch (error) {
      logError('Error getting webset results', error, { websetId });
      throw error;
    }
  }

  /**
   * Check webset status without waiting
   */
  async checkStatus(websetId: string) {
    try {
      const webset = await this.exa.websets.get(websetId);

      return {
        id: webset.id,
        status: webset.status,
        createdAt: webset.createdAt,
      };
    } catch (error) {
      logError('Error checking webset status', error, { websetId });
      throw error;
    }
  }

  /**
   * Cancel a running webset
   */
  async cancelWebset(websetId: string) {
    try {
      await this.exa.websets.cancel(websetId);
      logInfo('Webset cancelled', { websetId });
    } catch (error) {
      logError('Error cancelling webset', error, { websetId });
      throw error;
    }
  }
}
```

---

## Part 4: API Routes (with Auth, Validation, Rate Limiting)

### Company Webset Creation

```typescript
// app/api/websets/companies/create/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';
import { prisma } from '@/lib/prisma';
import { createCompanyWebsetSchema } from '@/lib/validation/websets';
import { logError, logInfo } from '@/lib/logging';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Authentication (Phase 3)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context (Phase 4)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { tenantId: true }
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    // Rate limiting (Phase 2) - Expensive operation, limit to 5 per hour
    const rateLimitResult = await rateLimit(request, {
      limit: 5,
      window: 3600000 // 1 hour
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      );
    }

    // Validation (Phase 1)
    const body = await request.json();
    const validationResult = createCompanyWebsetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Parse size if provided
    let sizeMin, sizeMax;
    if (data.size) {
      const match = data.size.match(/(\d+)-(\d+)/);
      if (match) {
        sizeMin = parseInt(match[1]);
        sizeMax = parseInt(match[2]);
      }
    }

    const service = new ExaWebsetsService();

    // Create the webset
    const websetResult = await service.findCompanies({
      industry: data.industry,
      geography: data.geography,
      size: data.size,
      sizeMin,
      sizeMax,
      additionalContext: data.additionalContext,
      maxResults: data.maxResults
    });

    // Store webset in database with tenant context
    const webset = await prisma.webset.create({
      data: {
        tenantId: user.tenantId,
        exaId: websetResult.id,
        type: 'company',
        status: websetResult.status,
        query: `${data.industry} in ${data.geography}`,
        criteria: data,
        createdBy: userId
      }
    });

    logInfo('Company webset created', {
      websetId: webset.id,
      tenantId: user.tenantId,
      userId
    });

    return NextResponse.json({
      websetId: webset.id,
      exaId: webset.exaId,
      status: webset.status,
      message: 'Company search started. This may take 2-5 minutes.'
    });

  } catch (error) {
    logError('Error in websets/companies/create', error);
    return NextResponse.json(
      { error: 'Failed to create company search' },
      { status: 500 }
    );
  }
}
```

### Check Webset Status

```typescript
// app/api/websets/companies/[id]/status/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logging';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { tenantId: true }
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    // Get webset with tenant check
    const webset = await prisma.webset.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId // Multi-tenancy check
      }
    });

    if (!webset) {
      return NextResponse.json({ error: 'Webset not found' }, { status: 404 });
    }

    const service = new ExaWebsetsService();
    const status = await service.checkStatus(webset.exaId);

    // Update status in database
    await prisma.webset.update({
      where: { id: params.id },
      data: {
        status: status.status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: webset.id,
      status: status.status,
      type: webset.type
    });

  } catch (error) {
    logError('Error checking webset status', error, { websetId: params.id });
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
```

### Get Webset Results

```typescript
// app/api/websets/companies/[id]/results/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logging';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { tenantId: true }
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    // Get webset with tenant check
    const webset = await prisma.webset.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      }
    });

    if (!webset) {
      return NextResponse.json({ error: 'Webset not found' }, { status: 404 });
    }

    const service = new ExaWebsetsService();

    // Get results
    const { items } = await service.getWebsetResults(webset.exaId);

    // Transform items to company format
    const companies = items.map((item: any) => {
      const enrichments = item.enrichments || {};

      return {
        name: item.title || item.name || 'Unknown Company',
        website: enrichments['Official company website URL'] || item.url,
        description: enrichments['Company description and what they do'],
        industry: enrichments['Primary industry and business model'],
        size: enrichments['Number of employees'] ?
          `${enrichments['Number of employees']} employees` : null,
        geography: enrichments['Company headquarters location with city and country'],
        foundedYear: enrichments['Year the company was founded'],
        funding: enrichments['Latest funding information if venture-backed'],
        revenue: enrichments['Annual revenue range if publicly available'],
        confidence: item.score || 0.8,
        exaUrl: item.url
      };
    });

    // Update webset status
    await prisma.webset.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        resultCount: companies.length,
        completedAt: new Date()
      }
    });

    logInfo('Webset results retrieved', {
      websetId: params.id,
      resultCount: companies.length,
      tenantId: user.tenantId
    });

    return NextResponse.json({
      companies,
      count: companies.length
    });

  } catch (error) {
    logError('Error getting webset results', error, { websetId: params.id });
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    );
  }
}
```

---

## Part 5: Frontend with React Query (Phase 6)

### Create React Query Hooks

```typescript
// lib/hooks/useWebsets.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logError } from '@/lib/logging';

export interface CreateCompanyWebsetParams {
  industry: string;
  geography: string;
  size?: string;
  additionalContext?: string;
  maxResults?: number;
}

export function useCreateCompanyWebset() {
  return useMutation({
    mutationFn: async (params: CreateCompanyWebsetParams) => {
      const response = await fetch('/api/websets/companies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create webset');
      }

      return response.json();
    },
    onError: (error) => {
      logError('Failed to create company webset', error);
    }
  });
}

export function useWebsetStatus(websetId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['webset-status', websetId],
    queryFn: async () => {
      if (!websetId) return null;

      const response = await fetch(`/api/websets/companies/${websetId}/status`);

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      return response.json();
    },
    enabled: enabled && !!websetId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if still processing
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 5000;
      }
      return false;
    }
  });
}

export function useWebsetResults(websetId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['webset-results', websetId],
    queryFn: async () => {
      if (!websetId) return null;

      const response = await fetch(`/api/websets/companies/${websetId}/results`);

      if (!response.ok) {
        throw new Error('Failed to get results');
      }

      return response.json();
    },
    enabled: enabled && !!websetId
  });
}
```

### Updated AI Lead Finder Page

```typescript
// app/ai-lead-finder/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logError } from '@/lib/logging';
import {
  useCreateCompanyWebset,
  useWebsetStatus,
  useWebsetResults
} from '@/lib/hooks/useWebsets';

export default function AILeadFinderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'search' | 'processing' | 'review'>('search');
  const [websetId, setWebsetId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  const [criteria, setCriteria] = useState({
    industry: '',
    geography: '',
    size: '',
    additionalContext: '',
    maxResults: 50
  });

  // React Query mutations and queries
  const createWebsetMutation = useCreateCompanyWebset();

  const { data: statusData } = useWebsetStatus(
    websetId,
    step === 'processing'
  );

  const { data: resultsData, refetch: refetchResults } = useWebsetResults(
    websetId,
    statusData?.status === 'completed' || statusData?.status === 'idle'
  );

  // Add companies mutation
  const addCompaniesMutation = useMutation({
    mutationFn: async (companies: any[]) => {
      const response = await fetch('/api/companies/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: companies.map(lead => ({
            ...lead,
            sourceType: 'ai_agent',
            sourceQuery: criteria.industry + ' in ' + criteria.geography
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add companies');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`✅ Added ${data.created} companies to your CRM!`);
      if (data.skipped > 0) {
        toast.info(`⚠️ Skipped ${data.skipped} duplicates`);
      }
      router.push('/companies');
    },
    onError: (error) => {
      logError('Failed to add companies', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add companies');
    }
  });

  // Auto-fetch results when status changes to completed
  useEffect(() => {
    if (statusData?.status === 'completed' || statusData?.status === 'idle') {
      refetchResults().then(({ data }) => {
        if (data?.companies && data.companies.length > 0) {
          setSelectedLeads(new Set(data.companies.map((_: any, i: number) => i)));
          setStep('review');
          toast.success(`✅ Found ${data.companies.length} companies!`);
        } else {
          toast.warning('No companies found matching your criteria');
          setStep('search');
        }
      });
    }
  }, [statusData?.status, refetchResults]);

  // Step 1: Create webset
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    createWebsetMutation.mutate(criteria, {
      onSuccess: (data) => {
        setWebsetId(data.websetId);
        setStep('processing');
        toast.success('🔍 Search started! Finding companies...');
      }
    });
  };

  // Step 2: Add selected leads
  const handleAddSelected = () => {
    if (!resultsData?.companies) return;

    const leadsToAdd = resultsData.companies.filter((_: any, i: number) =>
      selectedLeads.has(i)
    );

    if (leadsToAdd.length === 0) {
      toast.error('Please select at least one company to add');
      return;
    }

    addCompaniesMutation.mutate(leadsToAdd);
  };

  const toggleLead = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    if (!resultsData?.companies) return;
    setSelectedLeads(new Set(resultsData.companies.map((_: any, i: number) => i)));
  };

  const deselectAll = () => {
    setSelectedLeads(new Set());
  };

  // Processing view
  if (step === 'processing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-2">Finding Companies...</h1>
          <p className="text-gray-600 mb-4">
            Using AI to search the web for companies matching your criteria
          </p>
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-sm text-gray-500">
              This usually takes 2-5 minutes. Results will appear automatically.
            </p>
            {statusData && (
              <p className="text-sm font-medium mt-2">
                Status: {statusData.status}
              </p>
            )}
          </div>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">What's happening:</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <div>
                <p className="font-medium">Search started</p>
                <p className="text-gray-600">AI is searching the web for {criteria.industry} companies</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 animate-pulse">⏳</span>
              <div>
                <p className="font-medium">Enriching data</p>
                <p className="text-gray-600">Gathering company information, contact details, and metrics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gray-400">○</span>
              <div>
                <p className="font-medium text-gray-400">Filtering results</p>
                <p className="text-gray-600">Matching companies to your criteria</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Review view
  if (step === 'review' && resultsData?.companies) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Review AI-Generated Leads</h1>
            <p className="text-gray-600">Select which companies to add to your CRM</p>
          </div>
          <Button variant="outline" onClick={() => setStep('search')}>
            ← New Search
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedLeads.size} of {resultsData.companies.length} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={addCompaniesMutation.isPending || selectedLeads.size === 0}
            >
              {addCompaniesMutation.isPending
                ? 'Adding...'
                : `Add ${selectedLeads.size} to CRM`}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {resultsData.companies.map((lead: any, index: number) => (
            <Card
              key={index}
              className={`p-4 cursor-pointer transition-all ${
                selectedLeads.has(index) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => toggleLead(index)}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedLeads.has(index)}
                  onChange={() => toggleLead(index)}
                  className="mt-1"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{lead.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{lead.description}</p>
                    </div>
                    {lead.confidence && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {Math.round(lead.confidence * 100)}% match
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    {lead.industry && (
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <span className="ml-2 font-medium">{lead.industry}</span>
                      </div>
                    )}
                    {lead.geography && (
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 font-medium">{lead.geography}</span>
                      </div>
                    )}
                    {lead.size && (
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-2 font-medium">{lead.size}</span>
                      </div>
                    )}
                    {lead.foundedYear && (
                      <div>
                        <span className="text-gray-500">Founded:</span>
                        <span className="ml-2 font-medium">{lead.foundedYear}</span>
                      </div>
                    )}
                  </div>

                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 {lead.website}
                    </a>
                  )}

                  {lead.funding && (
                    <div className="mt-2 text-sm bg-green-50 p-2 rounded">
                      <span className="text-gray-600">Funding:</span>
                      <span className="ml-2">{lead.funding}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Search form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🤖 AI Lead Finder</h1>
        <p className="text-gray-600 mt-1">
          Use AI to discover companies matching your ideal customer profile
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Input
              id="industry"
              placeholder="e.g., SaaS, Fintech, Healthcare, E-commerce"
              value={criteria.industry}
              onChange={(e) => setCriteria({ ...criteria, industry: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="geography">Geography *</Label>
            <Input
              id="geography"
              placeholder="e.g., London, UK or San Francisco, USA"
              value={criteria.geography}
              onChange={(e) => setCriteria({ ...criteria, geography: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="size">Company Size</Label>
            <Input
              id="size"
              placeholder="e.g., 50-200 employees"
              value={criteria.size}
              onChange={(e) => setCriteria({ ...criteria, size: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="e.g., B2B focused, venture-backed, using Salesforce..."
              value={criteria.additionalContext}
              onChange={(e) => setCriteria({ ...criteria, additionalContext: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="maxResults">Maximum Results</Label>
            <Input
              id="maxResults"
              type="number"
              min="1"
              max="100"
              value={criteria.maxResults}
              onChange={(e) => setCriteria({ ...criteria, maxResults: parseInt(e.target.value) })}
            />
          </div>

          <Button
            type="submit"
            disabled={createWebsetMutation.isPending}
            className="w-full"
            size="lg"
          >
            {createWebsetMutation.isPending
              ? '🔍 Starting Search...'
              : '🔍 Find Companies with AI'}
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-sm mb-2">💡 Powered by Exa Websets:</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>AI searches the entire web for matching companies</li>
          <li>Automatically enriches data with contact info and metrics</li>
          <li>Takes 2-5 minutes to find high-quality leads</li>
          <li>Review and select which companies to add to your CRM</li>
        </ul>
      </Card>
    </div>
  );
}
```

---

## Summary of Changes

### Phase 1 (Validation) ✅
- Added Zod schemas for request validation
- Validated all inputs before processing

### Phase 2 (Rate Limiting) ✅
- Added rate limiting to expensive webset creation (5/hour)
- Proper rate limit headers returned

### Phase 3 (Authentication) ✅
- All routes check Clerk authentication
- User context extracted from auth()

### Phase 4 (Multi-Tenancy) ✅
- Added tenantId to Webset model
- All queries scoped by tenant
- Companies/People created with tenantId

### Phase 5 (Logging) ✅
- Replaced console.log/error with structured logging
- Added context to all log statements
- Proper error logging with Sentry integration

### Phase 6 (React Query) ✅
- Frontend uses useQuery/useMutation
- Automatic caching and refetching
- No manual fetch management
- React Query DevTools available

---

## Implementation Order

1. **Update Schema** → Run `npx prisma db push`
2. **Create Validation Schemas** → Add Zod schemas
3. **Update Exa Service** → Add structured logging
4. **Create API Routes** → With auth, validation, rate limiting
5. **Create React Query Hooks** → For frontend data management
6. **Update Frontend** → Use hooks instead of manual fetch

This plan ensures compatibility with all 6 security phases!
