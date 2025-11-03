# RevGeni CRM - Video Presentation Script
## Founding AI Engineer Technical Assessment
**Duration: ~15 minutes | Format: Screen recording with voiceover**

---

## 🎬 INTRODUCTION (0:00 - 1:00)

### [SCREEN: Title slide or homepage]

**"Hello, I'm presenting my solution for the RevGeni Founding AI Engineer technical assessment.**

**The Problem:** A sales team being crushed by a competitor, drowning in spreadsheets, with no budget for new tools or headcount. They need one thing: more qualified leads.

**My Solution:** I built a production-ready CRM with an integrated AI Worker that finds leads using advanced AI search and generates personalized outreach sequences. But more importantly, I built a system that solves the complete sales workflow—from lead discovery to pipeline management to automated follow-up.

Let me show you what I built, then we'll dive into the architecture and my technical decisions.

---

## 📊 PART 1: CORE CRM CAPABILITIES (1:00 - 5:00)

### [SCREEN: Analytics Dashboard - homepage]

**"First, the command center. This analytics dashboard gives leadership instant visibility into the entire sales operation."**

[HOVER over key metrics as you speak]

- **Revenue pipeline:** Real-time deal values and win probability calculations
- **Pipeline health:** Companies tracked by status—Lead, Qualified, Customer, Lost
- **Activity tracking:** Every touchpoint logged and visible
- **Deal progression:** Visual funnel showing where deals are and where they're stuck

**"This addresses the CEO's requirement for pipeline visibility. Every metric here is real-time, calculated from the underlying data model."**

---

### [SCREEN: Companies page]

**"Now, the foundation: Companies. This is where leads live."**

[SCROLL through the table, CLICK on a company]

**"Each company has:**
- **Status pipeline:** Lead → Qualified → Customer (or Lost)
- **Enrichment data:** Industry, size, geography—the exact filters our AI uses
- **Relationship tracking:** Connected people, deals, and activities
- **Smart actions:** Create deals, enroll in sequences, log activities—all one click away"

---

### [SCREEN: Single company detail page]

**"Here's what makes this powerful: unified context."**

[NAVIGATE through tabs: Overview → People → Deals → Activity → Sequences]

**"In one view I can see:**
- **Company information** with status pipeline (click through statuses to show real-time updates)
- **All contacts** at this company—decision makers, influencers, champions
- **Active deals** with their stages and values
- **Complete activity history**—every email, call, meeting, note
- **Email sequences** they're enrolled in—with next email timing

**And notice these quick actions:"** [POINT to quick action bar]
- Create a deal instantly
- Enroll in an email sequence
- Log an activity
- Add a new contact

**"This is critical: sales reps shouldn't waste time navigating. Everything they need is right here."**

---

### [SCREEN: Deals page - Pipeline view]

**"Let's talk about pipeline management—the lifeblood of any sales organization."**

[SCROLL through deals, CLICK on one]

**"Each deal has:**
- **Stage tracking:** From Discovery to Negotiation to Won/Lost
- **Win probability:** Automatically calculated based on stage
- **Expected value:** For accurate forecasting
- **Next action:** What needs to happen to move this forward

[SHOW stage progression visualization]

**"This visual progress indicator shows exactly where we are and what's next. Sales reps and managers can see at a glance which deals need attention."**

---

### [SCREEN: Deal detail page]

**"And here's the deal detail view:"**

[NAVIGATE through features]

- **Stage updater:** One-click stage progression with modal for capturing close date, probability, next actions
- **Activity timeline:** Full interaction history with this deal
- **Quick actions grid:** Log calls, meetings, emails, tasks—right from here

**"Notice the design: these quick actions use modern SVG icons in a clean 2x2 grid. This isn't just aesthetic—it's about cognitive load. Sales reps can glance and click without thinking."**

---

### [SCREEN: People and Activities pages - quick overview]

**"Quickly showing the other core entities:**

- **People:** Contacts with their companies, roles, and deal involvement
- **Events:** Unified activity log across all companies, people, and deals

**Every piece of data is interconnected. This isn't four separate modules—it's one integrated system."**

---

## 🤖 PART 2: AI LEAD GENERATION (5:00 - 8:00)

### [SCREEN: AI Lead Finder page]

**"Now, the game-changer: the AI Worker for lead generation."**

**"This addresses the core mission: finding qualified leads at scale. Let me show you how it works."**

[FILL in search form]

**"I can search by:**
- **Industry:** Technology, healthcare, finance, etc.
- **Company size:** Employee count ranges
- **Geography:** Specific regions or worldwide
- **Custom criteria:** Any natural language description

**Let's find enterprise SaaS companies in North America with 500-2000 employees."**

---

### [SCREEN: Search results with AI scores]

[CLICK search, WAIT for results to appear]

**"Here's what happens under the hood in under 5 seconds:**

1. **Exa AI searches** the web for companies matching these criteria
2. **Claude AI analyzes** each result against our requirements
3. **AI scoring engine** rates each lead on relevance, potential fit, and opportunity quality
4. **Results ranked** by AI confidence score with full justification

[POINT to the AI reasoning cards]

**"Look at these AI-generated insights:**
- Why this company is a good fit
- Specific data points that matched our criteria
- Potential objections or concerns
- Recommended next actions

**"This is not just data retrieval—this is AI-powered qualification. The system is thinking about lead quality, not just matching keywords."**

---

### [SCREEN: Select leads and import]

[SELECT several companies, CLICK import]

**"Now I can bulk-import these leads directly into the CRM. In one action, we've:**
- Found qualified prospects
- Enriched them with AI analysis
- Added them to our pipeline
- Made them ready for outreach

**"This is the leverage point. A sales team of 5 can now prospect like a team of 50."**

---

### [SCREEN: AI People Finder]

**"And we have the same capability for finding specific people at companies:"**

[Quick demo of searching for "VP of Sales at tech companies"]

**"Find decision-makers, champions, or specific roles—all with AI-powered relevance scoring."**

---

## 📧 PART 3: EMAIL SEQUENCES (8:00 - 10:00)

### [SCREEN: Email Sequences page]

**"Now, the Marketing Director's wish: automated email sequences."**

**"This solves the follow-up problem. Most deals die from lack of consistent follow-up, not from objections."**

---

### [SCREEN: Create sequence with AI]

**"I can create sequences in two ways: manually or with AI. Let me show you the AI approach."**

[CLICK "Create with AI", SELECT template, CHOOSE a sample company]

**"I select:**
- A template (Product demo, Partnership, Nurture, etc.)
- A company to personalize for
- Number of email steps
- Delay between emails

[CLICK generate, WAIT for AI to create the sequence]

**"Watch what happens:"**

---

### [SCREEN: AI-generated sequence preview]

**"In 10 seconds, Claude AI has created a complete multi-touch sequence:**
- Personalized for this specific company
- Multiple email steps with timing
- Compelling subject lines
- Contextual body copy

[SCROLL through the email steps]

**"Look at the email bodies—these aren't templates. This is personalized, contextual outreach that references:**
- The company's industry
- Their business challenges
- Specific value propositions
- Natural, conversational tone

**And here's the critical fix I implemented:"** [POINT to the formatted email display]

**"The BlockNote editor integration. This was broken—HTML was showing as raw code. I integrated a read-only BlockNote viewer so emails display exactly as they'll be sent, with formatting, links, and structure intact."**

---

### [SCREEN: Sequence detail page with enrollments]

**"Once a sequence is created, here's the operational view:"**

[SHOW the sequence steps, then SCROLL to enrollments]

**"The sequence management interface shows:**
- All email steps with timing
- Companies enrolled with their status
- Next scheduled email for each enrollment
- Ability to pause, resume, or unenroll

[POINT to an enrollment]

**"For each enrollment, I can:**
- See current status (Active, Paused, Completed)
- View timeline of sent and scheduled emails
- Pause with a required reason (for accountability)
- Resume (which recreates the scheduled emails)
- Unenroll completely

**"And notice this fix I made:"** [POINT to "Next email" timing]

**"The 'Next email' logic was showing past times—saying 'Next email: 20 minutes ago.' I fixed this to only show genuinely upcoming emails, filtering by status and future dates."**

---

### [SCREEN: Company detail page - Sequences tab]

**"Finally, from any company page, the Sequences tab shows all active enrollments:"**

[NAVIGATE to a company, CLICK Sequences tab]

**"Sales reps can see at a glance:**
- Which sequences this company is in
- Current step in each sequence
- Next email timing
- Quick enroll button for new sequences

**"This closed the loop: find leads with AI, enroll them in sequences, manage follow-up—all in one system."**

---

## 🏗️ PART 4: ARCHITECTURE DEEP DIVE (10:00 - 13:00)

### [SCREEN: Architecture diagram - High-level]

**"Now let's talk about how this is built. I created comprehensive architecture diagrams to document the system design."**

---

### **System Architecture**

[SHOW the high-level architecture diagram]

**"This is a modern, production-ready stack:**

**Frontend Layer:**
- Next.js 14 App Router for server and client components
- React Query for optimistic updates and state management
- Tailwind CSS and shadcn/ui for the design system
- BlockNote for rich text editing

**API Layer:**
- Next.js API Routes for the backend
- Authentication middleware using Clerk
- Tenant isolation for multi-tenancy
- RESTful design with proper error handling

**Business Logic:**
- AI orchestration layer for lead finding and sequence generation
- Integration with Exa AI for company search
- Integration with Claude AI for analysis and content generation
- Email scheduling engine

**Data Layer:**
- Prisma ORM for type-safe database access
- PostgreSQL for relational data
- Comprehensive data model with proper relationships

**External Services:**
- Clerk for authentication and multi-tenancy
- Exa AI for intelligent web search
- Anthropic Claude for AI reasoning
- Resend for email delivery (ready to integrate)
- Vercel for hosting and deployment

---

### [SCREEN: Data model diagram]

**"The data model is comprehensive:"**

[TRACE through the relationships]

**"Core entities:**
- **Tenant** → **Companies** → **People** → **Events**
- **Companies** → **Deals** with pipeline tracking
- **EmailSequences** → **SequenceEnrollments** → **ScheduledEmails**

**"Notice the relationships:**
- Every entity is tenant-scoped for security
- Companies can have multiple people, deals, events, and sequence enrollments
- Deals track primary contacts and company relationships
- Sequence enrollments manage the state of automated outreach
- Scheduled emails queue up future sends with status tracking

**"This isn't a toy schema—this is production-grade design with proper foreign keys, indexes, and cascade deletes."**

---

### [SCREEN: AI Lead Finder sequence diagram]

**"Let's look at a key workflow: the AI Lead Finder."**

[TRACE through the sequence diagram]

**"When a user searches for leads:**
1. Frontend sends criteria to `/api/ai/find-leads`
2. Lead Finder service orchestrates the AI workflow
3. Exa AI searches the web for matching companies
4. Results are sent to Claude AI for analysis and scoring
5. Claude returns structured data with reasoning
6. Optionally, companies are bulk-created in the database
7. Results with AI scores are returned to the frontend

**"This is real AI orchestration—not just API calls, but intelligent multi-step reasoning."**

---

### [SCREEN: Email Sequences flow diagram]

**"And the email sequence workflow:"**

[TRACE through the diagram]

**"Sequence creation and enrollment:**
1. User creates a sequence (manually or with AI)
2. System stores sequence steps with timing rules
3. User enrolls a company
4. System creates all scheduled emails based on step timing
5. Background job (in production) sends emails when due
6. System updates email status and enrollment progress

**"The architecture supports pausing sequences when deals reach certain stages—this prevents spam and maintains relationship quality."**

---

### [SCREEN: Component architecture diagram]

**"On the frontend, I've built a clean component hierarchy:"**

[POINT to different layers]

**"Three layers:**
- **Server Components:** Next.js pages that fetch data and render on the server
- **Client Components:** Interactive components with state (forms, tabs, modals)
- **Shared UI Components:** Reusable button, card, badge, dialog components

**"This leverages Next.js 14's server components for optimal performance while keeping interactivity where needed."**

---

## 💡 PART 5: TECHNOLOGY DECISIONS & TRADE-OFFS (13:00 - 14:30)

### [SCREEN: Back to code or terminal, or stay on architecture]

**"Let's address the tech stack requirements and my decisions."**

---

### **What I Used from the Required Stack:**

**✅ Core Stack (Required & Used):**
- **Next.js, React, TypeScript, Tailwind CSS:** Complete frontend stack
- **Radix UI (via shadcn/ui):** All UI components are built on Radix primitives
- **Blocknote:** Integrated for rich text email editing and viewing
- **TanStack React Query:** State management and API layer
- **Zod:** Schema validation throughout
- **Prisma & PostgreSQL:** Complete data layer (using Vercel Postgres, not Supabase)
- **Clerk:** Authentication with multi-tenancy
- **Vercel:** Hosting and deployment
- **Anthropic SDK:** Claude AI for reasoning and content generation
- **Exa API:** AI-powered company search
- **date-fns:** Date formatting throughout
- **ESLint & Sentry:** Code quality and error tracking

---

### **Justifiable Deviations:**

**🔄 Swapped Supabase → Vercel Postgres:**
- **Why:** Tighter integration with Vercel deployment pipeline
- **Trade-off:** Lost Supabase's built-in auth (but Clerk is better for multi-tenancy)
- **Impact:** Minimal—Prisma abstracts the database layer

**🔄 Skipped GraphQL:**
- **Why:** Next.js API Routes with REST are simpler for CRUD operations
- **Trade-off:** Lost GraphQL's flexible querying
- **Impact:** In this application, REST endpoints are more maintainable and the query patterns are straightforward

**🔄 Skipped TanStack Form → Used native React forms:**
- **Why:** Simpler forms didn't require complex state management
- **Trade-off:** Less form abstraction
- **Impact:** Faster development, more control over validation flow

**🔄 Skipped Zustand:**
- **Why:** React Query handles all our state needs (server state)
- **Trade-off:** No global client state store
- **Impact:** None—our state is either server-derived or local component state

**🔄 Didn't use OpenAI SDK, Perplexity SDK:**
- **Why:** Anthropic's Claude is superior for reasoning and structured output
- **Trade-off:** Single AI provider dependency
- **Impact:** Better results, simpler code

**❌ Not Implemented (Yet):**
- **Recharts:** Would use for enhanced analytics visualizations
- **Vitest/Testing Library:** Skipped unit tests in the interest of time (technical debt)
- **Mastra, CopilotKit, Langfuse:** These are AI orchestration/observability tools—valuable for production at scale, but overkill for a prototype
- **MCP, AG-UI, A2A:** Emerging protocols—not yet required for this use case
- **Nango:** Would use for CRM integrations (HubSpot, Salesforce sync)
- **OpenTelemetry:** Production observability—Sentry covers error tracking for now
- **graphql-ws:** Real-time subscriptions—not needed for this workflow

---

### **Known Gaps & Future Work:**

**⚠️ Email Sending:**
- **Current:** ScheduledEmails are queued but not automatically sent
- **Future:** Integrate Resend API with cron job or background worker

**⚠️ Testing:**
- **Current:** No unit or integration tests
- **Future:** Add Vitest and Testing Library for critical paths

**⚠️ Real-time Updates:**
- **Current:** Manual refresh for data updates
- **Future:** Add GraphQL subscriptions or websockets for live updates

**⚠️ Mobile Responsiveness:**
- **Current:** Desktop-first design, works on tablets
- **Future:** Optimize for mobile with responsive tables and touch interactions

**⚠️ Advanced Analytics:**
- **Current:** Basic metrics on dashboard
- **Future:** Integrate Recharts for cohort analysis, conversion funnels, revenue forecasting

---

## 🎯 CLOSING (14:30 - 15:00)

### [SCREEN: Back to homepage or demo something impressive one more time]

**"So, to summarize what I built:"**

**✅ Complete CRM:**
- Companies, People, Deals, Events—all interconnected
- Status pipeline for tracking progression
- Activity timeline for relationship history

**✅ AI-Powered Lead Generation:**
- Exa AI for intelligent web search
- Claude AI for analysis and scoring
- Bulk import with enrichment

**✅ Automated Email Sequences:**
- AI-generated personalized sequences
- Enrollment management with pause/resume
- Timeline view of all scheduled communications

**✅ Production-Ready Architecture:**
- Multi-tenant with Clerk
- Type-safe with TypeScript and Prisma
- Deployed on Vercel with CI/CD
- Comprehensive documentation

**✅ Thoughtful Engineering:**
- Used required stack where appropriate
- Made justifiable deviations based on use case
- Documented architecture with detailed diagrams
- Fixed bugs (BlockNote rendering, next email logic, header layout)
- Built with scalability in mind

---

**"This took me considerably more than 6-8 hours—closer to 20—because I wanted to deliver something production-ready, not just a prototype. I built a system that a sales team could actually use tomorrow."**

**"What I demonstrated here is:**
- **Product thinking:** Understanding the user's problem and building the right solution
- **Technical depth:** Modern architecture with clean patterns
- **AI integration:** Real orchestration, not just API calls
- **Engineering maturity:** Trade-off analysis, documentation, code quality

**"I'm excited about the opportunity to build the future of AI-powered sales tools at RevGeni, and I hope this demonstrates that I have the skills and mindset to be your founding AI engineer."**

**"Thank you for your time, and I look forward to discussing this further."**

---

## 📝 POST-PRODUCTION NOTES

### Video Editing Checklist:
- [ ] Add text overlays for key metrics and features
- [ ] Speed up AI generation sequences (show 2-3 seconds of loading, then jump to results)
- [ ] Zoom in on important UI elements (buttons, badges, scores)
- [ ] Add chapter markers in YouTube description:
  - 0:00 - Introduction
  - 1:00 - Core CRM Features
  - 5:00 - AI Lead Generation
  - 8:00 - Email Sequences
  - 10:00 - Architecture Deep Dive
  - 13:00 - Technology Decisions
  - 14:30 - Closing
- [ ] Background music: Subtle, professional (low volume)
- [ ] Cursor highlight: Make cursor more visible during demo
- [ ] Screen resolution: 1920x1080 or 1280x720 for clarity

### Delivery Checklist:
- [ ] GitHub repository link with clean README
- [ ] Deployment URL with demo credentials
- [ ] This video (uploaded to YouTube/Loom as unlisted)
- [ ] Architecture diagrams in repository docs folder
- [ ] Email to benedikt.glass@revgeni.ai with all links

---

## 🎬 PRODUCTION TIPS

1. **Pacing:** Speak clearly and slightly slower than normal conversation. This is information-dense.

2. **Screen Recording:**
   - Use 1920x1080 resolution
   - 30 FPS minimum
   - Hide bookmarks bar and unnecessary browser extensions
   - Close all other tabs except demo tabs
   - Disable notifications (Do Not Disturb mode)

3. **Audio:**
   - Use a good microphone (not laptop mic if possible)
   - Record in a quiet room
   - Use noise cancellation if available
   - Test audio levels before full recording

4. **Practice:**
   - Do a full dry run
   - Time yourself (aim for 14-15 minutes to stay under 15 with buffer)
   - Have all demo data preloaded
   - Test all features before recording

5. **Energy:**
   - Stand up while presenting (more energetic voice)
   - Smile (it comes through in your voice)
   - Be enthusiastic but professional
   - Show confidence in your work

**Good luck! You've built something impressive—now sell it with confidence.**
