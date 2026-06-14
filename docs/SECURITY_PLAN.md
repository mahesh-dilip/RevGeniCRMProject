# Production Security & Quality Implementation Plan

**Version:** Next.js 14.2.14 (no upgrades)
**Approach:** Incremental, validated at each step
**No Redis:** Using in-memory rate limiting for simplicity

---

## 🎯 Overview of Gaps to Address

1. ❌ **Authentication** - No Clerk, routes are public
2. ❌ **API Validation** - No Zod validation on request bodies
3. ❌ **Rate Limiting** - No protection on expensive endpoints
4. ❌ **Multi-Tenancy** - Schema has it, but not enforced per request
5. ❌ **RBAC** - No user roles or authorization
6. ❌ **Observability** - Only console.log, no Sentry
7. ❌ **State Management** - React Query installed but unused
8. ❌ **Testing** - No tests at all
9. ⚠️ **Email Sequences** - Modeled but not actually sent

---

## 📋 PHASE 1: API Validation & Error Handling (Week 1)

**Goal:** Secure the API surface without breaking existing functionality

### Step 1.1: Create Zod Validation Schemas ✅ No Breaking Changes

**Files to create:**
- `lib/validations/companies.ts`
- `lib/validations/people.ts`
- `lib/validations/deals.ts`
- `lib/validations/events.ts`
- `lib/validations/sequences.ts`

**Validation:**
```bash
# After creating schemas, verify:
1. npm run build  # Should still compile
2. App should still work normally
3. No breaking changes yet (schemas just exist)
```

**Why first:** Non-breaking. Just creates validation schemas, doesn't apply them yet.

---

### Step 1.2: Create Validation Middleware Helper ✅ No Breaking Changes

**Files to create:**
- `lib/middleware/validate.ts` - Helper function to validate request bodies

```typescript
// lib/middleware/validate.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }
}
```

**Validation:**
```bash
npm run build  # Should compile
# Helper exists but isn't used yet
```

**Why second:** Creates infrastructure without breaking anything.

---

### Step 1.3: Apply Validation to ONE Route (Test) ✅ Validate Before Proceeding

**Route to update:** `POST /api/companies` (simplest POST endpoint)

**Update strategy:**
1. Import validation helper and schema
2. Add validation before prisma operations
3. Keep all existing logic intact

**Validation after this step:**
```bash
# 1. Build should work
npm run build

# 2. Test the endpoint
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Company", "website": "https://test.com"}'
# Should return company object

# 3. Test validation rejects bad data
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
# Should return 400 validation error

# 4. Test UI still works
# Navigate to /companies/new and create a company
# Should work normally
```

**Why third:** Test validation on ONE route before rolling out to all.

---

### Step 1.4: Apply Validation to Remaining Routes ✅ One at a time, validate each

**Order of updates:**
1. `POST /api/people` - Simple entity
2. `POST /api/deals` - Simple entity
3. `POST /api/events` - Simple entity
4. `POST /api/companies/bulk-create` - Important (prevents abuse)
5. `POST /api/ai/find-leads` - Important (expensive operation)
6. `POST /api/sequences` - Complex nested validation
7. Update PUT/PATCH endpoints with partial schemas

**After EACH route update:**
```bash
# 1. Test the specific endpoint works
# 2. Test UI page that uses it works
# 3. Run npm run build to catch TypeScript errors
```

**Why incremental:** Catch issues early, don't break multiple routes at once.

---

## 📋 PHASE 2: In-Memory Rate Limiting (Week 1-2)

**Goal:** Protect expensive endpoints without Redis dependency

### Step 2.1: Create In-Memory Rate Limiter ✅ No Breaking Changes

**File to create:**
- `lib/middleware/rate-limit-memory.ts`

```typescript
// Simple in-memory rate limiter (resets on server restart)
type RateLimitStore = Map<string, { count: number; resetAt: number }>;

const stores = {
  ai: new Map() as RateLimitStore,
  bulk: new Map() as RateLimitStore,
  api: new Map() as RateLimitStore,
};

export async function rateLimit(
  identifier: string,
  type: 'ai' | 'bulk' | 'api' = 'api'
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limits = {
    ai: { max: 5, window: 60000 }, // 5/minute
    bulk: { max: 3, window: 60000 }, // 3/minute
    api: { max: 60, window: 60000 }, // 60/minute
  };

  const store = stores[type];
  const limit = limits[type];
  const now = Date.now();

  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    // Reset window
    store.set(identifier, {
      count: 1,
      resetAt: now + limit.window,
    });
    return { allowed: true };
  }

  if (record.count >= limit.max) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}
```

**Validation:**
```bash
npm run build  # Should compile
# Rate limiter exists but not applied yet
```

**Why in-memory:** Simple, no external dependencies, works for single-instance deployments. For production clustering, add Redis later.

---

### Step 2.2: Apply Rate Limiting to Expensive Endpoints

**Routes to protect (in order):**
1. `POST /api/ai/find-leads` - Most expensive (AI + Exa API)
2. `POST /api/companies/bulk-create` - Can flood database
3. `POST /api/sequences/[id]/enroll` - Email sending potential

**Validation after each:**
```bash
# Test rate limit works:
# Make 6 rapid requests to /api/ai/find-leads
# 6th should return 429 Too Many Requests

# Test UI still works normally (single requests)
```

**Why these first:** Most abuse-prone endpoints.

---

## 📋 PHASE 3: Authentication with Clerk (Week 2)

**Goal:** Add authentication without breaking existing functionality

### Step 3.1: Install Clerk and Create Basic Setup ✅ No route protection yet

**Actions:**
```bash
npm install @clerk/nextjs
```

**Files to create:**
- `middleware.ts` - Empty initially, just exports config
- Update `.env` with Clerk keys (from dashboard.clerk.com)

```typescript
// middleware.ts (initial - allows all routes)
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Validation:**
```bash
npm run build
npm run dev
# Navigate to app - should still work (no protection yet)
# Clerk is installed but not enforcing anything
```

**Why permissive first:** Verify Clerk works before locking down routes.

---

### Step 3.2: Add Clerk Provider and Sign-In UI ✅ Optional sign-in

**Files to update:**
- `app/layout.tsx` - Wrap with ClerkProvider
- `components/layout/Navigation.tsx` - Add optional UserButton

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

```typescript
// components/layout/Navigation.tsx
import { UserButton } from '@clerk/nextjs';

// Add to navigation:
<UserButton afterSignOutUrl="/" />
```

**Validation:**
```bash
npm run dev
# 1. App should load normally
# 2. UserButton shows in nav (sign in optional)
# 3. Can sign up/in if desired
# 4. Can still use app without signing in
```

**Why optional:** Users can test sign-in without being forced to.

---

### Step 3.3: Enforce Authentication on ALL Routes ⚠️ BREAKING CHANGE

**Update `middleware.ts`:**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = { /* same */ };
```

**Validation:**
```bash
npm run dev
# 1. Navigate to http://localhost:3000
# 2. Should redirect to /sign-in
# 3. Sign in with test account
# 4. Should access app normally
# 5. Test all major pages work after sign-in
```

**ROLLBACK if issues:**
```typescript
// Revert middleware.ts to Step 3.1 version (allow all)
```

**Why breaking:** First change that requires users to sign in.

---

## 📋 PHASE 4: Multi-Tenancy & RBAC (Week 3)

**Goal:** Isolate tenant data and add role-based permissions

### Step 4.1: Update Prisma Schema with User Model ✅ Database change

**Update `prisma/schema.prisma`:**
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  role      UserRole @default(USER)
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clerkId])
  @@index([tenantId])
}

enum UserRole {
  OWNER    // Full access + user management
  ADMIN    // Full access except user management
  MANAGER  // Can use AI, bulk ops, delete records
  USER     // Can create/edit, no delete or expensive ops
  READONLY // View only
}

model Tenant {
  // ... existing fields
  users User[] // Add this relation
}
```

**Validation:**
```bash
npx prisma db push
npx prisma generate
npm run build
npm run dev
# App should still work (User table exists but not used yet)
```

**Why separate:** Database changes are risky, isolate them.

---

### Step 4.2: Create Auth Context Helper ✅ No breaking changes

**File to create:**
- `lib/auth/context.ts`

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getAuthContext() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { tenant: true },
  });

  if (!user) {
    const clerkUser = await currentUser();
    // Auto-create user with tenant assignment
    user = await createUserWithTenant(clerkUser);
  }

  return {
    userId: user.id,
    clerkId: user.clerkId,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  };
}
```

**Validation:**
```bash
npm run build
# Helper exists but not called yet
```

**Why separate:** Test helper works before using everywhere.

---

### Step 4.3: Update ONE API Route with Tenant Isolation

**Route to update:** `GET /api/companies`

**Changes:**
1. Call `getAuthContext()` at start
2. Add tenant filter to query: `where: { tenantId: auth.tenantId }`

**Validation:**
```bash
# 1. Build and run
npm run build && npm run dev

# 2. Sign in as User A, create companies
# 3. Check database - companies have User A's tenantId
# 4. Sign in as User B (different email domain)
# 5. User B should see empty company list
# 6. Create company as User B
# 7. User A and B should NOT see each other's data
```

**CRITICAL:** If this doesn't work, don't proceed to other routes.

---

### Step 4.4: Apply Tenant Isolation to ALL Routes

**Order:**
1. All GET endpoints (read operations)
2. All POST endpoints (create operations)
3. All PUT/PATCH endpoints (update operations)
4. All DELETE endpoints (delete operations)

**After each batch, validate:**
```bash
# Test multi-user scenario
# Test UI pages work
# Test no cross-tenant data leaks
```

---

### Step 4.5: Add Permission Checks

**File to create:**
- `lib/auth/permissions.ts`

```typescript
export const Permissions = {
  USE_AI_LEAD_FINDER: ['OWNER', 'ADMIN', 'MANAGER'],
  BULK_CREATE: ['OWNER', 'ADMIN', 'MANAGER'],
  DELETE_COMPANY: ['OWNER', 'ADMIN', 'MANAGER'],
  CREATE_COMPANY: ['OWNER', 'ADMIN', 'MANAGER', 'USER'],
  // ... etc
};

export function requirePermission(auth, permission) {
  if (!Permissions[permission].includes(auth.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}
```

**Apply to expensive/dangerous endpoints:**
1. `POST /api/ai/find-leads` - Require MANAGER+
2. `POST /api/companies/bulk-create` - Require MANAGER+
3. All DELETE endpoints - Require MANAGER+

**Validation:**
```bash
# 1. Create test users with different roles (update role in DB)
# 2. Test USER cannot use AI lead finder
# 3. Test READONLY cannot create companies
# 4. Test MANAGER can do everything
```

---

## 📋 PHASE 5: Observability (Week 4)

**Goal:** Replace console.log with proper error tracking

### Step 5.1: Install and Configure Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Creates:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Validation:**
```bash
# 1. Trigger an error in the app
# 2. Check Sentry dashboard for error report
# 3. Verify error includes stack trace and context
```

---

### Step 5.2: Add Structured Logging Helper

**File to create:**
- `lib/logging.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

export function logError(message: string, error: unknown, context?: Record<string, any>) {
  console.error(message, error);
  Sentry.captureException(error, { extra: context });
}

export function logInfo(message: string, context?: Record<string, any>) {
  console.log(message, context);
}
```

**Replace console.error with logError throughout codebase.**

---

## 📋 PHASE 6: React Query Migration (Week 4-5)

**Goal:** Replace useEffect fetch patterns with React Query

### Step 6.1: Set Up Provider

**File to create:**
- `lib/react-query-provider.tsx`

**Update:**
- `app/layout.tsx` - Wrap with QueryClientProvider

**Validation:**
```bash
npm run build && npm run dev
# App should still work (provider exists but not used yet)
```

---

### Step 6.2: Migrate ONE Page (Test)

**Page to migrate:** `/companies` (list page)

**Before:**
```typescript
useEffect(() => {
  fetch('/api/companies')
    .then(r => r.json())
    .then(setCompanies);
}, []);
```

**After:**
```typescript
const { data: companies, isLoading } = useQuery({
  queryKey: ['companies'],
  queryFn: () => fetch('/api/companies').then(r => r.json()),
});
```

**Validation:**
```bash
# 1. Page loads and displays companies
# 2. Check React Query DevTools (should show query)
# 3. Test refetch on window focus
# 4. Test caching (navigate away and back)
```

---

### Step 6.3: Migrate Remaining Pages

**Order:**
1. List pages (companies, deals, people, tasks)
2. Detail pages
3. Form pages with useMutation

**After each page:**
```bash
# Test page works
# Test loading states
# Test error states
# Test mutations invalidate queries
```

---

## 📋 PHASE 7: Testing (Week 5)

### Step 7.1: Set Up Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

**Create:**
- `vitest.config.ts`
- `vitest.setup.ts`

---

### Step 7.2: Write Critical Path Tests

**Test priorities:**
1. Validation schemas work correctly
2. Auth context creates users properly
3. Tenant isolation prevents data leaks
4. Rate limiting blocks excess requests
5. Permission checks work for each role

**Start with:**
```typescript
// lib/validations/__tests__/companies.test.ts
import { describe, it, expect } from 'vitest';
import { CreateCompanySchema } from '../companies';

describe('CreateCompanySchema', () => {
  it('accepts valid company data', () => {
    const valid = {
      name: 'Acme Corp',
      website: 'https://acme.com',
    };
    expect(() => CreateCompanySchema.parse(valid)).not.toThrow();
  });

  it('rejects empty name', () => {
    const invalid = { name: '' };
    expect(() => CreateCompanySchema.parse(invalid)).toThrow();
  });
});
```

---

## 📋 PHASE 8: Email Sending (Optional - Week 6)

**Goal:** Actually send sequence emails

### Step 8.1: Choose Email Provider

**Options:**
- Resend (simplest API, generous free tier)
- SendGrid
- AWS SES

**Install:**
```bash
npm install resend
```

---

### Step 8.2: Create Email Sender Service

**File to create:**
- `lib/email/sender.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSequenceEmail(email: {
  to: string;
  subject: string;
  html: string;
}) {
  const result = await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email.to,
    subject: email.subject,
    html: email.html,
  });

  return result.id;
}
```

---

### Step 8.3: Create Cron Job to Send Scheduled Emails

**File to create:**
- `app/api/cron/send-emails/route.ts`

```typescript
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find scheduled emails due now
  const due = await prisma.scheduledEmail.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: new Date() },
    },
    include: { enrollment: { include: { company: { include: { people: true } } } } },
  });

  // Send each email
  for (const email of due) {
    const person = email.enrollment.company.people[0];
    if (!person?.email) continue;

    const externalId = await sendSequenceEmail({
      to: person.email,
      subject: email.subject,
      html: email.body,
    });

    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        externalId,
      },
    });
  }

  return Response.json({ sent: due.length });
}
```

**Set up Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/send-emails",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 🔍 VALIDATION CHECKLIST (After Each Phase)

Before moving to next phase:

- [ ] `npm run build` succeeds
- [ ] `npm run dev` works
- [ ] All existing UI pages still work
- [ ] No TypeScript errors
- [ ] Database queries return correct data
- [ ] No console errors in browser
- [ ] Manual testing of affected features passes

**If any checkbox fails:** Fix before proceeding.

---

## 🚀 ROLLBACK STRATEGY

Each phase is designed to be reversible:

**Phase 1 (Validation):** Just remove validation calls, keep schemas
**Phase 2 (Rate Limiting):** Remove rate limit calls
**Phase 3 (Auth):** Revert middleware.ts to allow all routes
**Phase 4 (Multi-Tenancy):** Remove tenant filters, keep User table
**Phase 5 (Sentry):** Sentry doesn't break anything, can disable
**Phase 6 (React Query):** Revert individual pages back to useEffect
**Phase 7 (Tests):** Tests don't affect runtime
**Phase 8 (Email):** Disable cron job

---

## 📊 ESTIMATED TIMELINE

- **Week 1:** Phases 1-2 (Validation + Rate Limiting)
- **Week 2:** Phase 3 (Authentication)
- **Week 3:** Phase 4 (Multi-Tenancy + RBAC)
- **Week 4:** Phases 5-6 (Sentry + React Query)
- **Week 5:** Phase 7 (Tests)
- **Week 6:** Phase 8 (Email - Optional)

**Total:** 5-6 weeks for full implementation

---

## 🎯 SUCCESS CRITERIA

By end of implementation:

✅ All routes require authentication
✅ All POST endpoints validate input with Zod
✅ Expensive endpoints are rate limited
✅ Users only see their tenant's data
✅ READONLY users cannot modify data
✅ MANAGER+ required for AI/bulk operations
✅ Errors go to Sentry, not just console
✅ Data fetching uses React Query (no useEffect)
✅ Critical paths have test coverage
✅ (Optional) Sequence emails actually send

---

## 📝 NEXT STEPS

Ready to begin? Start with:

```bash
# Phase 1, Step 1.1
mkdir -p lib/validations
touch lib/validations/companies.ts
# Create validation schemas...
```

Let me know when you're ready to proceed with Phase 1!
