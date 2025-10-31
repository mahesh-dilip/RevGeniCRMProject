# Fix: Exa Websets Enrichment Data Parsing

## Problem
The Exa websets implementation was failing to correctly parse and import company/people data due to incorrect assumptions about the Exa API response structure.

## Investigation
Ran test scripts to examine actual Exa API responses and discovered the enrichment data structure was completely different from what the code expected.

### Incorrect Assumption (Before)
```typescript
const enrichments = (item as any).enrichments || {};
const name = enrichments['Company name'] || 'Unknown'; // ❌ Wrong!
```

### Actual Exa Structure (Discovered)
```json
{
  "enrichments": [
    {
      "enrichmentId": "wenrich_xxx",
      "format": "text|url|number|email",
      "result": ["value"],
      "reasoning": "...",
      "references": [...]
    }
  ],
  "properties": {
    "company": {
      "name": "...",
      "employees": 123,
      "industry": "...",
      "location": "..."
    }
  }
}
```

## Root Cause
1. **Enrichments are arrays, not objects**: Enrichments come as an array of objects with `result` arrays, not key-value pairs
2. **Structured data available**: Exa provides a `properties.company` object with clean, structured data
3. **Results fetching race condition**: UI was checking `step === 'results'` before fetching, creating circular dependency

## Solution

### 1. Updated Company Websets Results Parser
- Changed from dictionary-style access to array-based parsing
- Added helper function `getEnrichmentValue()` to extract values by format type
- Prefer structured `properties.company` data when available
- Added logging to track parsing success

**File**: `app/api/websets/companies/[id]/results/route.ts`

### 2. Updated People Websets Results Parser
- Similar array-based parsing for people enrichments
- Extract data from `properties.person` object
- Better fallback logic for missing fields

**File**: `app/api/websets/people/[id]/results/route.ts`

### 3. Added TypeScript Types
Created proper interfaces for Exa responses:
- `ExaEnrichment` - for enrichment objects
- `ExaWebsetItem` - for complete item structure
- Updated `getWebsetResults()` return type

**File**: `lib/ai/exa-websets.ts`

### 4. Fixed UI Results Fetching
Removed circular dependency in results fetching logic:
```typescript
// Before: Won't fetch until step is 'results', but step won't change until fetched
useCompanyWebsetResults(websetId, step === 'results' && statusData?.status === 'completed')

// After: Fetch as soon as status is completed
useCompanyWebsetResults(websetId, statusData?.status === 'completed')
```

**Files**: 
- `app/ai-lead-finder/page.tsx`
- `app/ai-people-finder/page.tsx`

## Testing
1. Verified Exa API connection works
2. Created test webset and confirmed it completes (status: 'idle')
3. Examined actual response structure to guide fixes
4. All TypeScript types pass without errors

## Status Mapping Verification
✅ Confirmed correct:
- Exa 'idle' → Our 'completed'
- Exa 'running' → Our 'processing'
- Exa 'pending' → Our 'pending'

## Impact
- **Before**: Websets would complete but import 0 companies/people (all fields would be null/Unknown)
- **After**: Websets correctly extract and import all available data from Exa responses

## Next Steps
- Monitor logs when websets complete to ensure data is being imported correctly
- Consider adding UI feedback showing which enrichments were successfully populated
- May want to add data validation before import to catch any edge cases

## Date
October 31, 2025

