# System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "External Services"
        CLERK[Clerk Auth]
        EXA[Exa AI API]
        ANTHROPIC[Anthropic Claude API]
        EMAIL[Email Provider]
    end

    subgraph "Frontend - Next.js 14 App Router"
        PAGES[React Pages/Components]
        UI[UI Components<br/>shadcn/ui + BlockNote]
        RQ[React Query<br/>State Management]
    end

    subgraph "API Layer - Next.js Route Handlers"
        AUTH[Auth Context<br/>/lib/auth/context]
        COMPANIES_API[/api/companies]
        DEALS_API[/api/deals]
        PEOPLE_API[/api/people]
        SEQUENCES_API[/api/sequences]
        EVENTS_API[/api/events]
        AI_API[/api/ai/*]
        WEBSETS_API[/api/websets/*]
        ANALYTICS_API[/api/analytics]
    end

    subgraph "Business Logic Layer"
        LEAD_FINDER[AI Lead Finder<br/>/lib/ai/find-leads]
        SEQUENCE_GEN[Sequence Generator<br/>/lib/ai/generate-sequence]
        WEBSETS[Exa Websets<br/>/lib/ai/exa-websets]
        ENRICHMENT[Data Enrichment]
    end

    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        DB[(PostgreSQL<br/>Database)]
    end

    %% Frontend connections
    PAGES --> UI
    PAGES --> RQ
    RQ --> COMPANIES_API
    RQ --> DEALS_API
    RQ --> PEOPLE_API
    RQ --> SEQUENCES_API
    RQ --> EVENTS_API
    RQ --> AI_API
    RQ --> WEBSETS_API
    RQ --> ANALYTICS_API

    %% API to Auth
    COMPANIES_API --> AUTH
    DEALS_API --> AUTH
    PEOPLE_API --> AUTH
    SEQUENCES_API --> AUTH
    EVENTS_API --> AUTH
    AI_API --> AUTH
    WEBSETS_API --> AUTH
    ANALYTICS_API --> AUTH

    %% API to Business Logic
    AI_API --> LEAD_FINDER
    AI_API --> SEQUENCE_GEN
    WEBSETS_API --> WEBSETS
    COMPANIES_API --> ENRICHMENT

    %% Business Logic to External Services
    LEAD_FINDER --> EXA
    LEAD_FINDER --> ANTHROPIC
    SEQUENCE_GEN --> ANTHROPIC
    WEBSETS --> EXA
    SEQUENCES_API --> EMAIL

    %% Auth to Clerk
    AUTH --> CLERK

    %% API to Data Layer
    COMPANIES_API --> PRISMA
    DEALS_API --> PRISMA
    PEOPLE_API --> PRISMA
    SEQUENCES_API --> PRISMA
    EVENTS_API --> PRISMA
    AI_API --> PRISMA
    WEBSETS_API --> PRISMA
    ANALYTICS_API --> PRISMA

    %% Data Layer
    PRISMA --> DB

    style CLERK fill:#4F46E5
    style EXA fill:#10B981
    style ANTHROPIC fill:#F59E0B
    style EMAIL fill:#EF4444
    style DB fill:#3B82F6
```

## Data Model Architecture

```mermaid
erDiagram
    Tenant ||--o{ Company : has
    Tenant ||--o{ User : has
    Tenant ||--o{ Deal : has
    Tenant ||--o{ EmailSequence : has

    Company ||--o{ Person : employs
    Company ||--o{ Deal : "is associated with"
    Company ||--o{ Event : "has activities"
    Company ||--o{ SequenceEnrollment : "enrolled in"

    Person ||--o{ Event : "has activities"
    Person ||--o{ Deal : "is primary contact"

    Deal ||--o{ Event : "has activities"
    Deal ||--|o Company : "belongs to"
    Deal }o--|| Person : "primary contact"

    EmailSequence ||--o{ SequenceStep : contains
    EmailSequence ||--o{ SequenceEnrollment : has

    SequenceEnrollment ||--o{ ScheduledEmail : schedules
    SequenceEnrollment }o--|| Company : enrolls
    SequenceEnrollment }o--|| EmailSequence : "part of"

    Event }o--|| Company : "related to"
    Event }o--|o Person : "related to"
    Event }o--|o Deal : "related to"

    Company {
        string id PK
        string tenantId FK
        string name
        string status
        string website
        string industry
        string size
        string geography
        json enrichmentData
    }

    Person {
        string id PK
        string companyId FK
        string firstName
        string lastName
        string email
        string phone
        string title
        string linkedin
    }

    Deal {
        string id PK
        string tenantId FK
        string companyId FK
        string primaryContactId FK
        string title
        string stage
        decimal value
        int probability
        date closeDate
        string nextAction
        string lostReason
    }

    EmailSequence {
        string id PK
        string tenantId FK
        string name
        string description
        boolean active
        boolean pauseOnDealCreation
        json pauseOnDealStages
    }

    SequenceStep {
        string id PK
        string sequenceId FK
        int stepOrder
        int delayDays
        string subject
        string body
    }

    SequenceEnrollment {
        string id PK
        string sequenceId FK
        string companyId FK
        string status
        int currentStep
        string pauseReason
    }

    ScheduledEmail {
        string id PK
        string enrollmentId FK
        int stepOrder
        string subject
        string body
        datetime scheduledFor
        string status
        datetime sentAt
    }

    Event {
        string id PK
        string tenantId FK
        string type
        string companyId FK
        string personId FK
        string dealId FK
        string title
        string description
        datetime eventDate
    }
```

## Feature Flow: AI Lead Finder

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AI_API
    participant LeadFinder
    participant Exa
    participant Claude
    participant Prisma
    participant DB

    User->>Frontend: Input search criteria
    Frontend->>AI_API: POST /api/ai/find-leads
    AI_API->>LeadFinder: findLeads(criteria)

    LeadFinder->>Exa: Search companies
    Exa-->>LeadFinder: Company results

    LeadFinder->>Claude: Analyze & score results
    Claude-->>LeadFinder: Scored leads

    LeadFinder->>Prisma: Optionally create companies
    Prisma->>DB: INSERT companies
    DB-->>Prisma: Success

    Prisma-->>LeadFinder: Created companies
    LeadFinder-->>AI_API: Results with scores
    AI_API-->>Frontend: JSON response
    Frontend-->>User: Display leads with scores
```

## Feature Flow: Email Sequences

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SEQ_API
    participant ENROLL_API
    participant Prisma
    participant DB
    participant EmailProvider

    User->>Frontend: Create sequence
    Frontend->>SEQ_API: POST /api/sequences
    SEQ_API->>Prisma: Create sequence + steps
    Prisma->>DB: INSERT sequence
    DB-->>Prisma: Success
    Prisma-->>SEQ_API: Sequence created
    SEQ_API-->>Frontend: Success

    User->>Frontend: Enroll company
    Frontend->>ENROLL_API: POST /api/sequences/[id]/enroll
    ENROLL_API->>Prisma: Create enrollment
    ENROLL_API->>Prisma: Create scheduled emails
    Prisma->>DB: INSERT enrollment & emails
    DB-->>Prisma: Success
    Prisma-->>ENROLL_API: Enrollment created
    ENROLL_API-->>Frontend: Success

    Note over EmailProvider: Background Job
    EmailProvider->>Prisma: Query scheduled emails
    Prisma->>DB: SELECT where scheduledFor <= NOW()
    DB-->>Prisma: Pending emails
    Prisma-->>EmailProvider: Email list
    EmailProvider->>EmailProvider: Send emails
    EmailProvider->>Prisma: Update status to 'sent'
    Prisma->>DB: UPDATE emails
```

## Feature Flow: Deal Pipeline

```mermaid
stateDiagram-v2
    [*] --> Lead: New company added
    Lead --> Qualified: Qualification criteria met
    Lead --> Lost: Not a fit

    Qualified --> Proposal: Meeting scheduled
    Proposal --> Negotiation: Proposal sent
    Negotiation --> Won: Deal closed
    Negotiation --> Lost: Deal lost

    Won --> [*]
    Lost --> [*]

    note right of Qualified
        Sequence pauses if
        pauseOnDealCreation = true
    end note

    note right of Negotiation
        Sequence pauses if stage
        in pauseOnDealStages
    end note
```

## Component Architecture

```mermaid
graph LR
    subgraph "Page Components (Server)"
        COMP_PAGE[/companies/id/page.tsx]
        DEAL_PAGE[/deals/id/page.tsx]
        SEQ_PAGE[/sequences/id/page.tsx]
        PEOPLE_PAGE[/people/id/page.tsx]
    end

    subgraph "Client Components"
        COMP_TABS[CompanyTabs]
        DEAL_STAGE[StageUpdater]
        SEQ_ENROLL[EnrollmentCard]
        SEQ_STEPS[EmailStepsSection]
        BLOCKNOTE[BlockNoteViewer]
    end

    subgraph "UI Components"
        BUTTON[Button]
        CARD[Card]
        BADGE[Badge]
        TABLE[Table]
        DIALOG[Dialog]
    end

    subgraph "Shared Components"
        ACTIVITY[ActivityTimeline]
        BREADCRUMB[Breadcrumbs]
        QUICK_ACTIONS[QuickActions]
    end

    COMP_PAGE --> COMP_TABS
    COMP_PAGE --> ACTIVITY
    COMP_PAGE --> BREADCRUMB

    DEAL_PAGE --> DEAL_STAGE
    DEAL_PAGE --> ACTIVITY
    DEAL_PAGE --> QUICK_ACTIONS

    SEQ_PAGE --> SEQ_ENROLL
    SEQ_PAGE --> SEQ_STEPS
    SEQ_STEPS --> BLOCKNOTE

    PEOPLE_PAGE --> ACTIVITY
    PEOPLE_PAGE --> QUICK_ACTIONS

    COMP_TABS --> BUTTON
    COMP_TABS --> CARD
    DEAL_STAGE --> BADGE
    SEQ_ENROLL --> DIALOG

    style COMP_PAGE fill:#E0E7FF
    style DEAL_PAGE fill:#E0E7FF
    style SEQ_PAGE fill:#E0E7FF
    style PEOPLE_PAGE fill:#E0E7FF

    style COMP_TABS fill:#DBEAFE
    style DEAL_STAGE fill:#DBEAFE
    style SEQ_ENROLL fill:#DBEAFE
    style SEQ_STEPS fill:#DBEAFE
    style BLOCKNOTE fill:#DBEAFE
```

## Technology Stack

```mermaid
mindmap
  root((RevGeni CRM))
    Frontend
      Next.js 14 App Router
      React 18
      TypeScript
      Tailwind CSS
      shadcn/ui
      BlockNote Editor
      React Query
    Backend
      Next.js API Routes
      Prisma ORM
      PostgreSQL
      Clerk Auth
    External Services
      Anthropic Claude AI
      Exa AI Search
      Resend Email
      Vercel Hosting
    Dev Tools
      TypeScript
      ESLint
      Prettier
      Git/GitHub
```

## Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Middleware
    participant ClerkAuth
    participant API
    participant AuthContext
    participant Database

    User->>Browser: Access protected route
    Browser->>Middleware: Request with session
    Middleware->>ClerkAuth: Verify session
    ClerkAuth-->>Middleware: User data

    alt Valid Session
        Middleware->>Browser: Allow access
        Browser->>API: API request
        API->>AuthContext: getAuthContext()
        AuthContext->>ClerkAuth: Get user & org
        ClerkAuth-->>AuthContext: User & tenantId

        AuthContext->>Database: Query with tenantId filter
        Database-->>AuthContext: Tenant-specific data
        AuthContext-->>API: Authorized data
        API-->>Browser: Response
    else Invalid Session
        Middleware->>Browser: Redirect to /sign-in
    end
```

