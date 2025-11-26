# RevGeni CRM - API & Architecture Documentation

## 📋 Table of Contents
1. [API Routes Overview](#api-routes-overview)
2. [External Integrations](#external-integrations)
3. [Webhook Support](#webhook-support)
4. [Services & Business Logic](#services--business-logic)
5. [Background Jobs & Automations](#background-jobs--automations)

---

## API Routes Overview

### 🏢 Companies API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/companies` | List all companies with filtering/pagination |
| POST | `/api/companies` | Create a new company |
| GET | `/api/companies/[id]` | Get single company details |
| PATCH | `/api/companies/[id]` | Update company information |
| DELETE | `/api/companies/[id]` | Delete a company |
| POST | `/api/companies/[id]/convert-to-deal` | Convert company to a deal/opportunity |
| POST | `/api/companies/bulk-create` | Bulk create companies from import |

### 👥 People/Contacts API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/people` | List all contacts with filtering |
| POST | `/api/people` | Create a new contact |
| GET | `/api/people/[id]` | Get contact details |
| PATCH | `/api/people/[id]` | Update contact information |
| DELETE | `/api/people/[id]` | Delete a contact |

### 💰 Deals API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/deals` | List all deals with filtering |
| POST | `/api/deals` | Create a new deal |
| PATCH | `/api/deals/[id]/update-stage` | Update deal stage (triggers automations) |

### 📧 Sequences API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/sequences` | List all email sequences |
| POST | `/api/sequences` | Create new sequence |
| GET | `/api/sequences/[id]` | Get sequence details with steps |
| PATCH | `/api/sequences/[id]` | Update sequence configuration |
| DELETE | `/api/sequences/[id]` | Delete a sequence |
| POST | `/api/sequences/[id]/enroll` | Enroll company in sequence |
| PATCH | `/api/sequences/enrollments/[id]` | Update enrollment (pause/resume) |
| DELETE | `/api/sequences/enrollments/[id]` | Cancel enrollment |

### 📅 Events/Activities API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/events` | List all events/activities |
| POST | `/api/events` | Create new event |
| GET | `/api/events/[id]` | Get event details |
| PATCH | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |
| POST | `/api/events/quick-log` | Quick-log an activity |

### 🤖 AI-Powered APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ai/find-leads` | AI lead discovery using Exa search |
| POST | `/api/ai/generate-sequence` | Generate personalized email sequence with Claude |
| POST | `/api/ai/create-sequence-from-template` | Create sequence from template |
| GET | `/api/ai/test-sequence-generator` | Test AI service connectivity |

### 🌐 Websets API (Lead Discovery)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/websets/companies/create` | Create company discovery webset |
| GET | `/api/websets/companies/[id]/status` | Check webset status |
| GET | `/api/websets/companies/[id]/preview` | Preview webset results (first 10) |
| GET | `/api/websets/companies/[id]/results` | Get all webset results |
| POST | `/api/websets/companies/[id]/import` | Import webset results as companies |
| POST | `/api/websets/people/create` | Create people discovery webset |
| GET | `/api/websets/people/[id]/status` | Check people webset status |
| GET | `/api/websets/people/[id]/preview` | Preview people results |
| GET | `/api/websets/people/[id]/results` | Get all people results |
| POST | `/api/websets/people/[id]/import` | Import people as contacts |

### 📊 Analytics & Misc
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics` | Get dashboard analytics/metrics |
| GET | `/api/search` | Global search across entities |
| GET | `/api/sequence-templates` | List available sequence templates |
| GET | `/api/outreach-profiles` | List outreach profiles |
| POST | `/api/outreach-profiles` | Create outreach profile |
| GET | `/api/outreach-profiles/[id]` | Get profile details |
| PATCH | `/api/outreach-profiles/[id]` | Update profile |
| DELETE | `/api/outreach-profiles/[id]` | Delete profile |
| GET | `/api/test-error` | Test error tracking (Sentry) |

---

## External Integrations

### 🔌 Active Integrations

#### 1. **Anthropic Claude AI**
- **Purpose**: AI-powered email sequence generation
- **Usage**: Generates personalized cold outreach emails
- **Model**: `claude-sonnet-4-20250514`
- **Files**:
  - `lib/ai/sequence-generator.ts` - Email sequence generation
  - `lib/ai/lead-finder.ts` - Lead data extraction
- **API Key**: `ANTHROPIC_API_KEY`
- **Features**:
  - Personalized email generation based on company/person context
  - Lead data extraction from search results
  - Template-based sequence creation
  - Tone customization (formal/casual/technical)

#### 2. **Exa (formerly Metaphor)**
- **Purpose**: AI-powered web search and lead discovery
- **Usage**: Finding companies and people based on criteria
- **SDK**: `exa-js` v1.10.2
- **Files**:
  - `lib/ai/exa-websets.ts` - Websets service
  - `lib/ai/lead-finder.ts` - Lead search
- **API Key**: `EXA_API_KEY`
- **Features**:
  - Neural search for companies by industry/geography/size
  - People search by job titles/companies/seniority
  - Progressive enrichment (company info, contact details, LinkedIn)
  - Websets for async lead discovery
  - Webhook support for real-time updates (optional)

#### 3. **Clerk**
- **Purpose**: User authentication and multi-tenant management
- **Usage**: Optional authentication layer
- **Package**: `@clerk/nextjs` v6.34.1
- **Environment Variables**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - Sign-in/sign-up URLs configured

#### 4. **Sentry**
- **Purpose**: Error tracking and performance monitoring
- **Usage**: Production error monitoring
- **Package**: `@sentry/nextjs` v10.22.0
- **Files**:
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `instrumentation.ts`
- **Environment Variables**:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`

#### 5. **PostgreSQL** (via Supabase or direct)
- **Purpose**: Primary database
- **Package**: `@prisma/client` v5.20.0
- **Environment Variables**:
  - `DATABASE_URL` - Connection pooling URL
  - `DIRECT_URL` - Direct connection for migrations

### ❌ NOT Integrated (but could be)
- **Email delivery** - No SendGrid, Resend, or SMTP integration (emails are generated but not sent)
- **Calendar sync** - No Google Calendar or Outlook integration
- **Third-party CRMs** - No Salesforce, HubSpot sync
- **Contact enrichment** - No Clearbit, Apollo, or ZoomInfo (uses Exa instead)

---

## Webhook Support

### 🎣 Webhook Capabilities

#### Exa Websets Webhooks (Optional)
**File**: `lib/ai/exa-websets.ts:442-493`

**Status**: Implemented but not actively used (requires `EXA_WEBHOOK_SECRET`)

**Supported Events**:
- `webset.item.created` - When a new lead/company is discovered
- `webset.item.enriched` - When enrichment data is completed
- `webset.idle` - When processing is complete

**Methods**:
```typescript
// Register webhook
registerWebhook(baseUrl: string)

// List webhooks
listWebhooks()

// Delete webhook
deleteWebhook(webhookId: string)
```

**Endpoint** (would need to be created):
- `/api/webhooks/exa` - Receive Exa webhook events

**Current Implementation**:
- Webhook registration methods exist
- Polling is used instead (status checks every 5s)
- No webhook endpoint currently implemented

### 🚫 No Outgoing Webhooks
The application does not currently send webhooks to external systems.

---

## Services & Business Logic

### 📁 Library Structure

```
lib/
├── ai/                          # AI & Lead Discovery Services
│   ├── exa-websets.ts           # Exa websets service (company/people discovery)
│   ├── lead-finder.ts           # AI lead finding with Exa + Claude
│   ├── sequence-generator.ts    # AI email sequence generation
│   └── validators.ts            # AI response validation schemas
│
├── automations/                 # Business Logic Automations
│   ├── triggers.ts              # Event triggers (company/deal/event updates)
│   ├── deal-stage-triggers.ts   # Deal stage change automation
│   ├── lifecycle-progression.ts # Lifecycle stage progression logic
│   └── sequence-rules.ts        # Sequence pause/resume rules
│
├── scoring/                     # Lead Scoring
│   └── lead-scoring.ts          # Company lead score calculation
│
├── email/                       # Email Processing
│   └── template-interpolation.ts # Email template variable replacement
│
├── security/                    # Security Services
│   └── duplicate-detection.ts   # Prevent duplicate records
│
├── validation/                  # Data Validation
│   ├── websets.ts              # Webset validation schemas
│   └── (no other files)
│
├── validations/                 # Zod Schemas
│   ├── ai.ts                   # AI request validation
│   ├── companies.ts            # Company data validation
│   ├── deals.ts                # Deal data validation
│   ├── events.ts               # Event data validation
│   ├── people.ts               # People data validation
│   └── sequences.ts            # Sequence data validation
│
├── middleware/                  # API Middleware
│   ├── validate.ts             # Request validation middleware
│   └── rate-limit-memory.ts    # In-memory rate limiting
│
├── hooks/                       # React Hooks
│   └── use-websets.ts          # Websets polling hook
│
├── auth/                        # Authentication
│   └── context.ts              # Auth context
│
├── constants/                   # Constants
│   └── sequence-templates.ts   # Email sequence templates
│
├── utils/                       # Utility Functions
│   ├── retry.ts                # Retry logic with exponential backoff
│   ├── formatters.ts           # Data formatting utilities
│   ├── constants.ts            # App constants
│   └── recently-viewed.ts      # Recently viewed tracking
│
└── Core Files
    ├── prisma.ts               # Prisma client singleton
    ├── logging.ts              # Structured logging
    ├── sentry-utils.ts         # Sentry utilities
    ├── react-query-provider.tsx # TanStack Query setup
    └── utils.ts                # General utilities (cn, etc.)
```

### 🎯 Key Services

#### AI Services
- **ExaWebsetsService** (`lib/ai/exa-websets.ts`)
  - Company and people discovery
  - Progressive enrichment
  - Background processing
  - Webhook registration (optional)

- **Sequence Generator** (`lib/ai/sequence-generator.ts`)
  - Claude-powered email generation
  - Template-based sequences
  - Personalization engine
  - Context assembly

- **Lead Finder** (`lib/ai/lead-finder.ts`)
  - Exa search integration
  - AI data extraction
  - Confidence scoring
  - Retry logic with exponential backoff

#### Automation Services
- **Triggers** (`lib/automations/triggers.ts`)
  - `onCompanyUpdate()` - Update lead score and lifecycle
  - `onDealCreated()` - Set lifecycle to "opportunity"
  - `onEventCreated()` - Update last engaged timestamp

- **Deal Stage Triggers** (`lib/automations/deal-stage-triggers.ts`)
  - `onDealStageChange()` - Main orchestrator
  - `handleDemoStage()` - Pause sequences, create demo task
  - `handleProposalStage()` - Create follow-up tasks
  - `handleWonStage()` - Complete sequences, mark as customer
  - `handleLostStage()` - Resume sequences

- **Lifecycle Progression** (`lib/automations/lifecycle-progression.ts`)
  - Automatic lifecycle stage updates
  - Based on engagement and activity

- **Sequence Rules** (`lib/automations/sequence-rules.ts`)
  - Pause/resume company sequences
  - Enrollment management

#### Scoring Services
- **Lead Scoring** (`lib/scoring/lead-scoring.ts`)
  - `updateCompanyLeadScore()` - Calculate lead scores
  - Based on engagement, activity, deal stage

---

## Background Jobs & Automations

### ⚙️ Current Implementation

**Status**: No dedicated background job system (no cron, no queues)

**How it works**:
- **Event-driven automations** - Triggered by API calls
- **In-process execution** - Automations run synchronously in API routes
- **Client-side polling** - For long-running operations (websets)

### 📊 Automation Triggers

#### 1. **Company Update Automation**
**Trigger**: Any company PATCH request
**File**: `lib/automations/triggers.ts:5-11`
**Actions**:
- Recalculate lead score
- Update lifecycle stage
- Update last engaged timestamp

**Called from**: `app/api/companies/[id]/route.ts`

#### 2. **Deal Creation Automation**
**Trigger**: New deal created
**File**: `lib/automations/triggers.ts:13-32`
**Actions**:
- Set company lifecycle to "opportunity"
- Update lastEngaged timestamp
- Recalculate lead score

**Called from**: `app/api/deals/route.ts`

#### 3. **Deal Stage Change Automation**
**Trigger**: Deal stage updated
**File**: `lib/automations/deal-stage-triggers.ts:5-50`
**Actions**:
- Create event log for stage change
- Stage-specific actions:
  - **Demo**: Pause sequences, create demo prep task
  - **Proposal**: Create follow-up task (3 days)
  - **Won**: Complete all sequences, mark as customer
  - **Lost**: Resume sequences, log reason

**Called from**: `app/api/deals/[id]/update-stage/route.ts`

#### 4. **Event/Activity Creation**
**Trigger**: New event logged
**File**: `lib/automations/triggers.ts:34-52`
**Actions**:
- Update company lastEngaged timestamp
- Recalculate lead score
- Update lifecycle stage

**Called from**: `app/api/events/route.ts`

#### 5. **Sequence Enrollment Processing**
**Trigger**: Company enrolled in sequence
**File**: Various sequence routes
**Actions**:
- Create initial sequence step
- Schedule next email (client-side tracking)
- Update enrollment status

**Note**: Email sending is NOT automated - emails are generated but must be manually sent

### 🔄 Polling-Based Operations

#### Websets Status Polling
**File**: `lib/hooks/use-websets.ts`
**Interval**: 5 seconds
**Purpose**: Check Exa webset completion status
**Method**: GET `/api/websets/[companies|people]/[id]/status`

**Progressive Fetching**:
- Items available immediately (5-10 seconds)
- Enrichments added in background
- No need to wait for "idle" status

### 🚫 NOT Implemented

- ❌ **Scheduled emails** - No cron job to send emails at specific times
- ❌ **Email delivery** - Emails are generated, not sent
- ❌ **Data sync jobs** - No recurring sync with external systems
- ❌ **Cleanup jobs** - No automatic data archival/deletion
- ❌ **Report generation** - No scheduled reports
- ❌ **Webhook retry** - No webhook delivery retry mechanism
- ❌ **Queue system** - No Bull, BullMQ, or other queue library

### 💡 Potential Improvements

To add true background jobs, consider:

1. **Vercel Cron** - Add `vercel.json` with cron configuration:
```json
{
  "crons": [{
    "path": "/api/cron/send-scheduled-emails",
    "schedule": "*/5 * * * *"
  }]
}
```

2. **Background Workers** - Use libraries like:
   - `bullmq` for Redis-based queues
   - `agenda` for MongoDB-based scheduling
   - `node-cron` for simple scheduling

3. **Webhook Processing** - Implement Exa webhook endpoint for real-time updates instead of polling

---

## Summary

### ✅ What Exists
- 35 API endpoints across 7 main resource types
- AI-powered lead discovery (Exa)
- AI-powered email generation (Claude/Anthropic)
- Event-driven automations (triggers)
- Lead scoring system
- Lifecycle progression
- Deal stage automation
- Duplicate detection
- Rate limiting (in-memory)
- Error tracking (Sentry)
- Multi-tenant auth (Clerk - optional)

### ❌ What Doesn't Exist
- Email sending infrastructure
- Scheduled/cron jobs
- Background job queues
- Calendar integrations
- Third-party CRM sync
- Traditional enrichment services (uses Exa instead)
- Webhook endpoints (registration code exists, but no receiver)
- Data export APIs
- Bulk operations (except bulk company creation)

### 🎯 Architecture Highlights
- Next.js 14 App Router
- Server-side API routes
- Event-driven automations (no queues)
- Client-side polling for long operations
- Progressive enrichment strategy
- AI-first approach to content generation and lead discovery

---

**Generated**: 2025-11-26
**Project**: RevGeni CRM
**Version**: Production-ready demo
