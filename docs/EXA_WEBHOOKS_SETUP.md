# Exa WebSets - Progressive Results Implementation

## 🎯 Overview

This document describes the **progressive results fetching** implementation for Exa WebSets, which allows users to see search results in real-time as they're discovered, rather than waiting for the entire search to complete.

## ✨ Key Features

### 1. **Zero Initial Enrichments**
- Websets are created **without** enrichments to avoid the 60-120 second wait time
- Enrichments are added in the background after creation
- Items start appearing in 5-10 seconds instead of 60-120 seconds

### 2. **Progressive Item Fetching**
- Items are fetched immediately using the `/items` list endpoint
- No need to wait for `idle` or `completed` status
- Frontend polls every 2 seconds while `status === 'running'` or `'processing'`

### 3. **Live UI Updates**
- Results appear on screen as soon as they're discovered
- New items are automatically added to the list in real-time
- Live status banner shows search progress
- Auto-selects new items as they arrive

### 4. **Background Enrichments**
- Enrichments run asynchronously after webset creation
- Non-blocking - errors don't stop the main flow
- Enrichment data updates progressively as it becomes available

## 📊 Performance Gains

**Before (with enrichments on creation):**
```
Create → Wait 60-120s → Display all results
First result visible: 60-120 seconds
```

**After (progressive fetching):**
```
Create → 5-10s → Display first results ✅
       ↓
Background enrichments (30-60s) → Update progressively
First result visible: 5-10 seconds (12x faster!)
```

## 🔧 Implementation Details

### Backend Changes

#### 1. `lib/ai/exa-websets.ts`

**Zero Enrichments on Creation:**
```typescript
async findCompanies(params: CompanySearchParams): Promise<WebsetResult> {
  // Create webset WITHOUT enrichments
  const webset = await this.exa.websets.create({
    search: {
      query,
      count: maxResults,
      entity: { type: 'company' },
      criteria
    }
    // NO enrichments array here
  } as any);

  // Add enrichments in background (non-blocking)
  this.addCompanyEnrichments(webset.id).catch(err =>
    logError('Background enrichment failed', err)
  );

  return {
    id: webset.id,
    status: 'pending',
    itemCount: 0
  };
}
```

**Progressive Item Fetching:**
```typescript
async fetchItemsProgressive(websetId: string): Promise<any[]> {
  try {
    // Fetch items immediately without waiting for completion
    const items = await this.exa.websets.items.list(websetId, { limit: 100 });
    return items.data || [];
  } catch (error) {
    logError('Error fetching items progressively', error, { websetId });
    return [];
  }
}
```

**Background Enrichments (Fixed API Call):**
```typescript
async addCompanyEnrichments(websetId: string): Promise<void> {
  const enrichments = [
    { description: 'Official company website URL', format: 'url' },
    { description: 'Number of employees', format: 'number' },
    // ... more enrichments
  ];

  for (const enrichment of enrichments) {
    try {
      // CORRECT: Pass websetId as first arg, enrichment as second
      await this.exa.websets.enrichments.create(websetId, enrichment);
    } catch (error) {
      logError('Error adding enrichment', error, { websetId, enrichment });
      // Continue with other enrichments even if one fails
    }
  }
}
```

#### 2. Preview API Routes

**`app/api/websets/companies/[id]/preview/route.ts`:**
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // ... auth and webset lookup

  // Allow fetching items even while webset is processing
  if (webset.status === 'failed') {
    return NextResponse.json({ error: 'Webset processing failed' }, { status: 400 });
  }

  // Fetch results progressively
  const exaService = new ExaWebsetsService();
  const items = await exaService.fetchItemsProgressive(webset.exaId);

  if (!items || items.length === 0) {
    return NextResponse.json({
      success: true,
      count: 0,
      companies: [],
      message: 'No companies found yet in webset',
      status: webset.status
    });
  }

  // Parse and return companies
  const companies = parseCompanyData(items);

  return NextResponse.json({
    success: true,
    count: companies.length,
    companies,
    totalResults: items.length,
    status: webset.status,
    isPartial: webset.status !== 'completed' // Indicate if more results are coming
  });
}
```

### Frontend Changes

#### 1. React Query Hooks (`lib/hooks/use-websets.ts`)

**Continuous Polling:**
```typescript
export function useCompanyWebsetPreview(websetId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['websets', 'companies', websetId, 'preview'],
    queryFn: async () => {
      const response = await fetch(`/api/websets/companies/${websetId}/preview`);
      return response.json();
    },
    enabled: !!websetId && enabled,
    retry: 1,
    staleTime: (query) => {
      // Allow refetching while status is not completed
      const data = query?.state?.data as any;
      const status = data?.status;
      return (status === 'running' || status === 'processing' || data?.isPartial) ? 0 : Infinity;
    },
    refetchInterval: (query) => {
      // Keep polling while webset is still processing
      const data = query?.state?.data as any;
      const status = data?.status;

      // Poll if status indicates processing OR if we have partial data
      if (status === 'running' || status === 'processing' ||
          (data?.isPartial && status !== 'completed')) {
        return 2000; // Poll every 2 seconds for new items
      }
      return false;
    },
  });
}
```

#### 2. Frontend Pages

**Early Advance to Review (`app/ai-lead-finder/page.tsx`):**
```typescript
useEffect(() => {
  if (statusData?.status === 'failed') {
    toast.error('Webset processing failed. Please try again.');
    setStep('search');
  } else if (step === 'processing' && previewData && previewData.count > 0) {
    // Advance to review as soon as we have ANY results (progressive display)
    setStep('review');
    // Auto-select all companies as they come in
    if (previewData.companies) {
      setSelectedIds(previewData.companies.map((c: any) => c.exaId));
    }
  } else if (statusData?.status === 'completed' && step === 'processing') {
    // Webset completed but no results found
    toast.error('No companies found matching your criteria.');
    setStep('search');
  }
}, [statusData?.status, step, previewData, isLoadingPreview]);
```

**Auto-Select New Items:**
```typescript
// Auto-select new items as they arrive during review
useEffect(() => {
  if (step === 'review' && previewData?.companies) {
    const currentIds = previewData.companies.map((c: any) => c.exaId);
    // Add any new IDs that aren't already selected
    setSelectedIds(prev => {
      const newIds = currentIds.filter(id => !prev.includes(id));
      return newIds.length > 0 ? [...prev, ...newIds] : prev;
    });
  }
}, [previewData?.companies, step]);
```

**Live Status Banner:**
```tsx
{/* Live status banner */}
{isStillSearching && (
  <Card className="p-4 bg-blue-50 border-blue-200">
    <div className="flex items-center gap-3">
      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      <div className="flex-1">
        <p className="font-medium text-blue-900">
          🔍 Still searching for more companies...
        </p>
        <p className="text-sm text-blue-700">
          Results are being added in real-time. Enrichments are being processed in the background.
        </p>
      </div>
    </div>
  </Card>
)}

{isCompleted && (
  <Card className="p-4 bg-green-50 border-green-200">
    <div className="flex items-center gap-3">
      <span className="text-2xl">✅</span>
      <div className="flex-1">
        <p className="font-medium text-green-900">
          Search complete!
        </p>
        <p className="text-sm text-green-700">
          All companies have been discovered. Enrichments may still be processing in the background.
        </p>
      </div>
    </div>
  </Card>
)}
```

## 🐛 Bugs Fixed

### 1. **Enrichment API Call Error**
**Error:** `ExaError: Validation Error. description: Required`

**Root Cause:** Incorrect API call format
```typescript
// ❌ WRONG
await this.exa.websets.enrichments.create({ websetId, ...enrichment });

// ✅ CORRECT
await this.exa.websets.enrichments.create(websetId, enrichment);
```

### 2. **UI Stuck on "Discovery complete!" with 0 Results**
**Root Cause:** No handling for completed websets with zero items

**Fix:** Added explicit check for `count === 0` when status is `completed`

### 3. **Preview Hook Stops Polling Prematurely**
**Root Cause:** `refetchInterval` only checked `isPartial` flag, not the actual status

**Fix:** Updated polling logic to check both `status` and `isPartial`:
```typescript
if (status === 'running' || status === 'processing' ||
    (data?.isPartial && status !== 'completed')) {
  return 2000; // Keep polling
}
```

## 📝 API Behavior Validation

Created `test-exa-api-behavior.js` to validate Exa API behavior:

**Key Findings:**
- ✅ Items appear at ~7 seconds while status is still `running`
- ✅ `items.list()` works immediately, no need to wait for `idle`
- ✅ Enrichments complete separately (~9 seconds)
- ✅ Webset reaches `idle` at ~19 seconds
- ✅ Pattern 1 for enrichments API is correct: `create(websetId, config)`

## 🎉 User Experience

### Before
1. User submits search
2. Loading spinner for 60-120 seconds
3. All results appear at once
4. User reviews and imports

### After
1. User submits search
2. Loading spinner for 5-10 seconds
3. **First results appear** ✨
4. **New results keep appearing in real-time** ✨
5. **Live status banner shows progress** ✨
6. **"Search complete!" message when done** ✨
7. User reviews and imports (can import even while enrichments are processing)

## 🔮 Future Enhancements

### Webhooks (Optional)
For even better real-time updates, you can implement webhooks:

1. **Setup webhook endpoint:** `POST /api/webhooks/exa`
2. **Register webhook with Exa:** Subscribe to `webset.item.created` events
3. **Push updates to frontend:** Use WebSockets or Server-Sent Events

**Benefits:**
- Instant updates without polling
- Reduced API calls
- Lower latency

**Trade-offs:**
- More complex infrastructure
- Requires webhook endpoint management
- Current polling solution works well for most use cases

## 📚 References

- [Exa WebSets API Documentation](https://docs.exa.ai/websets/api)
- [How WebSets Work](https://docs.exa.ai/websets/api/how-it-works)
- [Enrichments API](https://docs.exa.ai/websets/api/websets/enrichments)
- [Items API](https://docs.exa.ai/websets/api/websets/items)

## ✅ Testing Checklist

- [x] Create webset without enrichments
- [x] Items appear within 5-10 seconds
- [x] Frontend advances to review step automatically
- [x] New items appear in real-time
- [x] Live status banner updates correctly
- [x] "Search complete!" message appears when done
- [x] New items are auto-selected
- [x] Enrichments process in background
- [x] Zero results handled gracefully
- [x] Failed websets handled gracefully
- [x] Polling stops when search completes

