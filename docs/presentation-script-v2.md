
**"Hello, I'm presenting my solution for the RevGeni Founding AI Engineer technical assessment.**

**The Scenario:** A sales team getting crushed by a competitor. They're drowning in spreadsheets with no process, no budget for new tools or headcount. The sales director needs one thing: more qualified leads so her team can focus on building relationships and selling.

**My Solution:** I built a production-ready CRM with an integrated AI Worker that discovers leads using advanced AI search technology, then automatically enrolls them in personalized email sequences. But this isn't just a lead finder—it's a complete sales operations platform that handles the entire workflow from prospect discovery to pipeline management to automated follow-up.

Let me walk you through what I built."

---

## 📊 PART 1: OVERVIEW - DASHBOARD & ANALYTICS (1:00 - 3:00)

### [SCREEN: Homepage - Sales Dashboard after login]

**"This is what you see immediately after logging in: the Sales Dashboard—your command center."**

**"Four key metrics at the top:"**
- Total Companies in the CRM
- Active Deals in the pipeline
- Total Pipeline Value
- Won Deals count

**"Below that, two critical sections:"**

**"On the left: Upcoming Tasks—the next 5 tasks due this week with company context and quick completion. Sales reps can see exactly what needs attention."**

**"On the right: Quick Actions—one-click access to the most common workflows:"**
- AI Lead Finder (our AI worker)
- Add Company manually
- Create New Deal
- Generate AI Email Sequence

**"This dashboard solves the 'what do I do next?' problem. Sales reps land here and immediately know their priorities."**

---

### [SCREEN: Navigate to Analytics page]

**"Now, leadership visibility. The Analytics page."**

[PAUSE to show the charts]

**"This uses Recharts for sophisticated visualization:**
- **Pipeline funnel**: Deals by stage with values
- **Win rate and averages**: Performance metrics
- **Company status breakdown**: Lead → Customer conversion
- **Monthly trends**: Deals, companies, and revenue over time
- **Activity breakdown**: What the team is actually doing

**"This addresses the CEO's requirement for pipeline visibility. Real-time, calculated from actual data, not vanity metrics."**

---

## 🏢 PART 2: COMPANIES & AI LEAD FINDER (3:00 - 6:30)

### [SCREEN: Companies page]

**"Let's dive into the core CRM. First, Companies—your leads and customers."**

[SHOW the table, then SORT/FILTER if available]

**"Each company has:**
- **Status**: Lead → Qualified → Customer (or Lost)
- **Industry, Geography, Size**: The exact filters our AI uses to find similar companies
- **Deal count and total value**: Pipeline visibility at a glance

[CLICK on a company]

---

### [SCREEN: Company detail page - Overview tab]

**"On a single company page, I have everything I need:"**

[SHOW the status pipeline at top]

**"Visual status pipeline—click any status to update instantly. This is live, not just UI. Watch:"**

[CLICK Lead → Qualified]

**"Status updated. The backend tracks this, the analytics update, reports reflect it. This is real-time sales pipeline management."**

[NAVIGATE through tabs]

**"Now the tabs:**
- **Overview**: Company info, priority, description
- **People**: All contacts at this company—decision makers, influencers
- **Deals**: Active opportunities with this company and their stages
- **Activity**: Complete interaction history—every call, email, meeting, note
- **Sequences**: Email campaigns they're enrolled in with next send timing

**"This unified view means sales reps never lose context. Everything related to this company is right here."**

[SHOW quick action bar]

**"And these quick actions are strategically placed—create a deal, enroll in a sequence, log activity, add a contact. The most common actions, one click away. No hunting through menus."**

---

### [SCREEN: AI Lead Finder page]

**"Now, the game-changer: the AI Worker for lead generation. This solves the core mission—finding qualified leads at scale."**

**"Here's the search form."**

[FILL in the form as you describe]

**"I specify:**
- **Industry**: The sector I'm targeting—say, SaaS or Fintech
- **Geography**: Where companies are located—London, San Francisco, etc.
- **Company Size**: Employee count range—50-200 employees
- **Additional Context**: Optional refinements—'venture-backed' or 'using HubSpot' or 'recently funded'
- **Max Results**: How many leads to find—up to 100

**"Let's search for enterprise SaaS companies in North America with 100-500 employees."**

[CLICK "Find Leads with AI"]

---

### [SCREEN: Processing screen]

**"Now watch what happens. The system creates an Exa Webset—this is advanced AI-powered web discovery."**

[SHOW the processing screen with status]

**"Under the hood:**
1. Exa AI searches the entire web for companies matching these criteria
2. The system enriches each company with structured data—employee count, website, industry, founding year
3. Results stream in real-time
4. Duplicate detection runs automatically

**"This takes 30-60 seconds depending on the search breadth."**

[Wait for results]

---

### [SCREEN: Review results with checkboxes]

**"And here are the results. This is the review step."**

[SHOW the list of companies with checkboxes]

**"Look at what we get for each company:**
- Company name
- Description (what they do)
- Industry match
- Location
- Employee count
- Founded year
- Website link

**"Every company has a checkbox. I can review each one and decide which to import."**

[SHOW the selection controls]

**"At the top: Select All, Deselect All. At the bottom: a sticky action bar showing how many are selected."**

[SELECT a few companies]

**"Let's import these 5 companies."** [CLICK Import]

---

### [SCREEN: Importing, then Results]

**"The import process:**
1. Checks for duplicates (by website domain)
2. Creates company records
3. Adds enrichment data
4. Assigns 'Lead' status

[SHOW success screen]

**"Import complete! 5 companies added. The system tells me if any were skipped as duplicates."**

[CLICK "View Companies in CRM"]

**"And there they are—instantly available in the CRM with all their enriched data."**

**"This is the leverage point. A sales team of 5 can now prospect like a team of 50. The AI handles the tedious research—they focus on relationships."**

---

## 👥 PART 3: PEOPLE & AI PEOPLE FINDER (6:30 - 8:30)

### [SCREEN: People page]

**"Now let's look at People—the contacts in our CRM."**

[SHOW the people table]

**"Each person shows:**
- **Name and title**: Who they are and their role
- **Company**: Where they work (clickable link)
- **Email and phone**: Contact details
- **Relationship to deals**: Which opportunities they're involved in

[CLICK on a person]

---

### [SCREEN: Person detail page]

**"On a person's page, we have:**
- Contact information
- Company affiliation (clickable)
- Deals they're the primary contact for
- Activity history—all interactions with this person
- Sequences they're enrolled in

**"This shows the interconnected nature of the CRM—every person is linked to their company, their deals, and their communication history."**

---

### [SCREEN: AI People Finder page]

**"And just like we can find companies with AI, we can find people."**

[SHOW the AI People Finder form]

**"The AI People Finder lets me search for specific roles:**
- **Job Title**: 'VP of Sales', 'CTO', 'Head of Marketing'
- **Company Context**: Industry, size, location filters
- **Additional Context**: 'at Series B companies' or 'recently hired'
- **Max Results**: Up to 100 people

**"This is perfect for targeted outreach—finding decision-makers at specific types of companies."**

[Optionally DEMO the search or just explain]

**"The workflow is identical: AI search → review results → selective import. Same Exa technology, different entity type."**

**"Combined, these AI tools mean I can build a targeted prospect list of companies AND their decision-makers in minutes, not days."**

---

## 💼 PART 4: DEALS & PIPELINE MANAGEMENT (8:30 - 10:00)

### [SCREEN: Deals page]

**"Now let's look at pipeline management—the Deals page."**

[SHOW table of deals]

**"Each deal shows:**
- **Stage**: Discovery → Proposal → Negotiation → Won/Lost
- **Value and probability**: For accurate forecasting
- **Company and primary contact**: Relationship context
- **Next action**: What needs to happen to move forward

---

### [SCREEN: Create New Deal workflow]

**"Let me show you how to create a deal."**

[CLICK "New Deal" button]

**"The form captures:**
- Deal name and description
- Company (with search/autocomplete)
- Primary contact
- Deal value
- Expected close date
- Initial stage
- Win probability
- Next action

**"This ensures every deal starts with complete context—no missing information."**

[FILL and SUBMIT, or just walk through]

---

### [SCREEN: Deal detail page]

**"Here's a deal in detail. Notice the design—everything important is immediately visible without scrolling."**

[POINT to stage progression visualization]

**"This visual progress tracker shows where we are in the sales cycle. The current stage is highlighted, completed stages are marked, future stages are dimmed. It's intuitive."**

[SHOW the stage updater]

**"And updating the stage is powerful:"** [CLICK to show modal]

**"When I move a deal forward, I'm prompted to capture:**
- Close date
- Win probability
- Next action

**"This isn't just tracking—it's capturing sales intelligence that makes forecasting accurate."**

[SHOW quick actions grid]

**"Quick actions for this deal: log calls, meetings, emails, tasks. Grid layout with clear SVG icons—designed for speed. Sales reps can log a call in 3 clicks: here, call, save. Done."**

**"And there are tabs showing:**
- Activities logged for this deal
- Tasks associated with it
- Timeline of stage changes

**"Everything about this deal, in one place."**

---

## ✅ PART 5: TASKS & ACTIVITIES (10:00 - 11:00)

### [SCREEN: Tasks page]

**"Task management—what needs to get done."**

[SHOW tasks table]

**"Each task shows:**
- Title and description
- Related company (if applicable)
- Due date
- Priority
- Completion status

---

### [SCREEN: Create New Task workflow]

[CLICK "New Task"]

**"Creating a task is straightforward:**
- Title and description
- Due date
- Priority (High/Medium/Low)
- Related company (optional—links the task to context)
- Assignee (in a multi-user setup)

[FILL and SUBMIT, or walk through]

**"Tasks can be created from anywhere—the dashboard, a company page, a deal page. They're always linked to context."**

---

### [SCREEN: Activities/Events page]

**"And the Activities page—the unified activity log."**

[SHOW events table]

**"Every interaction is logged here:**
- Calls
- Meetings
- Emails
- Notes

**"Each activity shows:**
- Type (with visual icon)
- Company and person involved
- Date
- Notes/summary

---

### [SCREEN: Create New Activity workflow]

[CLICK "New Activity"]

**"Logging an activity:**
- Activity type (Call, Meeting, Email, Note)
- Company
- Person (optional)
- Date
- Notes/summary

[WALK through the form]

**"This creates a permanent record tied to the company and person. Sales managers can see team activity. Reps can review interaction history before a call."**

**"The power here: every piece of data is interconnected. A company has deals, people, activities, and tasks. Everything is linked, nothing is siloed."**

---

## 📧 PART 6: EMAIL SEQUENCES (11:00 - 13:30)

### [SCREEN: Sequences page]

**"Now, automated outreach—solving the follow-up problem. Most deals die from lack of consistent follow-up, not from objections."**

**"This is the Sequences page."** [SHOW the table]

**"Each sequence shows:**
- Name and description
- Status (Active/Inactive)
- Number of email steps
- Companies enrolled
- Automation settings (pause on deal creation, pause on certain stages)

**"I can create sequences manually or with AI. Let me show you the AI approach—this is where it gets impressive."**

---

### [SCREEN: Create sequence with AI]

[CLICK "Create with AI"]

**"The AI sequence generator. Here's how it works:"**

[SHOW the form]

1. **Select a template**: Partnership outreach, product demo, nurture campaign, re-engagement...
2. **Choose a sample company**: The AI will personalize for this company's industry and context
3. **Set number of steps**: 3, 5, or 7 emails
4. **Set delay days**: How many days between emails

**"Let's create a 5-step product demo sequence for a SaaS company."**

[FILL and SUBMIT]

---

### [SCREEN: AI generating sequence]

**"The system calls Claude AI with the template, company context, and parameters."**

[WAIT for generation - show loading state]

---

### [SCREEN: Preview generated sequence]

**"And in 10 seconds, we have a complete, personalized 5-email sequence."**

[SCROLL through the email steps]

**"Look at these emails:**
- **Step 1**: Intro email with specific company references
- **Step 2**: Value proposition tied to their industry
- **Step 3**: Case study or social proof
- **Step 4**: Demo offer with clear CTA
- **Step 5**: Final touch re-engagement

**"Each email has:**
- Compelling subject line
- Personalized body with actual company name and industry-specific pain points
- Natural, conversational tone
- Clear next action

**"And notice the email bodies display properly."** [POINT to an email]

**"This is rendered using the BlockNote editor—a requirement from the tech stack brief. It supports rich text formatting, links, lists, bold/italic. The emails display exactly as they'll be sent, not as raw HTML code."**

---

### [SCREEN: Save sequence and navigate to detail page]

[CLICK Save]

**"Sequence saved. Now let's look at the operational view."**

---

### [SCREEN: Sequence detail page]

**"Here's the sequence management interface."**

[SHOW the header area]

**"At the top: sequence name, active status badge, and action buttons. The layout is responsive—the badge and buttons don't overlap even on smaller screens."**

[SCROLL to email steps section]

**"The Email Steps section shows all emails with their timing and content. Each step displays in the BlockNote viewer with proper formatting."**

[SCROLL to enrollments section]

**"And here's the enrollments—companies actively in this sequence."**

---

### [SCREEN: Show an enrollment card]

**"Each enrollment card shows:**
- Company name (clickable to company page)
- Status badge (Active, Paused, Completed, Cancelled)
- Current step number
- When they were enrolled
- **Next email timing** (e.g., 'Next email: in 2 days')

[POINT to pause reason if visible]

**"If paused, it shows why—accountability for every status change."**

[CLICK Timeline button]

**"The timeline view:"** [SHOW expanded timeline]

**"Every scheduled email with:**
- Subject line
- Status (Scheduled, Sent, or Cancelled)
- Timing relative to now
- Visual indicators (green for sent, blue for scheduled, grey for cancelled)

**"This is operational visibility—sales managers can see exactly where every company is in every sequence."**

---

### [SHOW enrollment actions]

**"And the controls:"**

[POINT to each button]

- **Pause**: Requires a reason (e.g., 'Prospect requested to pause'). Cancels all scheduled emails.
- **Resume**: Recreates scheduled emails from current step forward, sending next email immediately
- **Timeline**: Show/hide the email schedule
- **Unenroll**: Remove from sequence entirely

**"These controls give reps flexibility while maintaining data integrity."**

---

### [SCREEN: Navigate to a company page, click Sequences tab]

**"And from any company page, the Sequences tab shows all their active enrollments:"**

[SHOW the sequences tab]

- Which sequences they're in
- Current step
- Status
- Next email timing
- Quick enroll button

**"The loop is closed: find leads with AI → enroll in sequences → manage follow-up—all in one system."**

---

## 🏗️ PART 7: ARCHITECTURE & ENGINEERING (13:30 - 15:00)

### [SCREEN: Architecture diagram or stay in app]

**"Now let's talk about how this is engineered. I've documented the system with comprehensive architecture diagrams."**

---

### **System Architecture**

**"This is built on a modern, production-ready stack:**

**Frontend:**
- Next.js 14 App Router—server and client components for optimal performance
- React Query for state management and optimistic updates
- shadcn/ui component library built on Radix primitives
- BlockNote for rich text email editing (per the tech stack requirement)
- Tailwind CSS for styling

**Backend:**
- Next.js API Routes—RESTful endpoints with proper error handling
- Authentication with Clerk—multi-tenant from day one
- Prisma ORM for type-safe database access
- PostgreSQL database (Vercel Postgres)

**External Services:**
- Exa AI for intelligent web search—this powers the AI Lead Finder
- Anthropic Claude for content generation—this powers the AI Sequence Generator
- Clerk for authentication and organization management
- Vercel for deployment

---

### **Data Model**

**"The database schema is comprehensive:**

- **Tenant** → Companies, Deals, Sequences (multi-tenant architecture)
- **Company** → People, Deals, Events, SequenceEnrollments
- **Deal** → Primary Contact, Events, Stage History
- **EmailSequence** → Steps, Enrollments
- **SequenceEnrollment** → ScheduledEmails

**"Every entity is tenant-scoped for security. Foreign keys enforce referential integrity. Cascade deletes clean up orphaned data."**

---

### **Key Workflows**

**"The AI Lead Finder workflow:**
1. User submits search criteria
2. System creates an Exa Webset via API
3. Exa discovers companies and enriches data
4. Results stream back in real-time
5. User reviews and selects companies
6. System imports with duplicate detection

**"The Email Sequence workflow:**
1. User creates sequence (manually or with AI)
2. System stores sequence steps with timing rules
3. User enrolls companies
4. System creates ScheduledEmail records for each step
5. Background job (in production) sends emails when due
6. System tracks status and updates enrollment progress

**"The system also supports intelligent automation:**
- Pause sequences when a deal is created (configurable per sequence)
- Pause sequences when deals reach specific stages (e.g., Negotiation)
- This prevents spam and maintains relationship quality."**

---

### **Technology Decisions & Trade-offs**

**"Let's address the tech stack requirements and my decisions."**

---

### **What I Used (Required & Implemented):**

✅ **Core Stack:**
- Next.js, React, TypeScript, Tailwind CSS
- Radix UI (via shadcn/ui)—all components use Radix primitives
- **BlockNote**—implemented for email editing and viewing, as required
- TanStack React Query—complete state management layer
- Zod—schema validation throughout
- Prisma & PostgreSQL (Vercel Postgres)
- Clerk—multi-tenant authentication
- Vercel—hosting with CI/CD
- Anthropic Claude—AI content generation
- Exa API—AI-powered company search
- date-fns—date formatting
- ESLint & Sentry—code quality and error tracking

---

### **Justifiable Deviations:**

🔄 **Supabase → Vercel Postgres:**
- **Why**: Tighter Vercel integration, simpler deployment pipeline
- **Trade-off**: Lost Supabase's built-in auth (but Clerk is better for B2B multi-tenancy)

🔄 **Skipped GraphQL:**
- **Why**: Next.js API Routes with REST are simpler and more maintainable for CRUD operations
- **Trade-off**: No flexible client-side querying (but React Query handles data fetching efficiently)

🔄 **Skipped TanStack Form:**
- **Why**: Native React forms with Zod validation are sufficient for our use cases
- **Impact**: Less abstraction, more direct control

🔄 **Skipped Zustand:**
- **Why**: React Query handles all server state (which is 95% of our state)
- **Impact**: Simpler architecture, one less dependency

🔄 **Focused on Anthropic (not OpenAI/Perplexity):**
- **Why**: Claude is superior for structured output and reasoning tasks
- **Impact**: Better results for AI generation

---

### **Not Implemented (Future Work):**

❌ **Recharts**: Actually partially used in analytics, but could expand for more visualizations
❌ **Vitest/Testing Library**: Skipped unit tests in interest of time (would add for production)
❌ **Mastra/CopilotKit/Langfuse**: AI orchestration/observability tools—valuable at scale but overkill for prototype
❌ **MCP, AG-UI, A2A**: Emerging AI protocols—not yet required for this use case
❌ **Nango**: Would use for third-party CRM integrations (Salesforce, HubSpot sync)
❌ **OpenTelemetry**: Production observability—Sentry covers errors for now
❌ **graphql-ws**: Real-time subscriptions—not needed for current workflows

---

### **Known Gaps:**

⚠️ **Email Sending**: ScheduledEmails are queued but not automatically sent (would integrate Resend with cron job)
⚠️ **Testing**: No unit/integration tests (technical debt accepted for time)
⚠️ **Mobile UX**: Desktop-first design works on tablets but needs mobile optimization
⚠️ **Advanced Analytics**: Basic metrics implemented; would add cohort analysis and forecasting with more Recharts

---

## 🎯 PART 8: CLOSING & SUMMARY (15:00 - 16:00)

### [SCREEN: Dashboard or something impressive]

**"So, to summarize what I built in this assessment:"**

---

**✅ Complete CRM:**
- Companies, People, Deals, Events—all interconnected with real-time updates
- Status pipeline tracking for lead progression
- Activity timeline for relationship history
- Multi-tenant from day one with Clerk

**✅ AI-Powered Lead Generation:**
- Exa websets for intelligent web discovery
- Real-time streaming results
- Selective import with duplicate detection
- Works for both companies and people

**✅ Automated Email Sequences:**
- AI-generated personalized campaigns using Claude
- Enrollment management with pause/resume/unenroll
- Timeline view of scheduled communications
- Smart automation (pause on deal stages)

**✅ Production-Ready Engineering:**
- Modern Next.js 14 architecture
- Type-safe with TypeScript and Prisma
- Comprehensive error handling
- Deployed on Vercel with CI/CD
- Documented with detailed architecture diagrams

---

**"This took me significantly more than the estimated 6-8 hours—closer to 25—because I wanted to deliver something production-quality, not just a prototype. I built a system that a sales team could actually deploy tomorrow and start using to close more deals."**

---

**"What this demonstrates:"**

- **Product thinking**: I didn't just build to the spec—I built to solve the actual problem
- **Technical depth**: Modern architecture with clean separation of concerns
- **AI integration**: Real orchestration with Exa and Claude, not just API wrappers
- **Engineering maturity**: Trade-off analysis, proper data modeling, error handling
- **Attention to detail**: UX polish, responsive layouts, proper state management

---

**"I'm excited about the opportunity to build the future of AI-powered sales tools at RevGeni. This assessment demonstrates that I have the technical skills, product judgment, and execution speed to be your founding AI engineer."**

**"Thank you for your time. I look forward to discussing this in detail."**

---

## 📝 VIDEO PRODUCTION CHECKLIST

### Pre-Recording:
- [ ] Seed database with realistic demo data (companies with good names, deals in various stages)
- [ ] Clear browser cache/cookies
- [ ] Test all features work end-to-end
- [ ] Prepare AI search in advance (have criteria ready)
- [ ] Have sequence examples ready to show
- [ ] Open all necessary tabs beforehand
- [ ] Close unnecessary browser tabs/applications
- [ ] Enable Do Not Disturb mode
- [ ] Check lighting and audio levels

### Recording Setup:
- [ ] 1920x1080 resolution
- [ ] 30 FPS minimum
- [ ] Use quality microphone
- [ ] Record in quiet space
- [ ] Have water nearby
- [ ] Stand while recording (better energy)

### During Recording:
- [ ] Speak clearly, slightly slower than normal
- [ ] Pause between sections for editing
- [ ] If you make a mistake, pause, then restart that sentence
- [ ] Show confidence—you built something impressive
- [ ] Smile (comes through in voice)
- [ ] Use cursor to point at UI elements

### Post-Production:
- [ ] Add text overlays for key features/metrics
- [ ] Speed up long AI generation sequences (show 2-3 seconds, then jump to result)
- [ ] Add zoom-ins on important UI elements
- [ ] Add chapter markers in video description
- [ ] Subtle background music (very low volume)
- [ ] Export in 1080p

### Submission Checklist:
- [ ] Video uploaded (YouTube unlisted or Loom)
- [ ] GitHub repository link with README
- [ ] Deployment URL (Vercel)
- [ ] Demo credentials clearly stated
- [ ] Architecture diagrams in `/docs` folder
- [ ] Email everything to benedikt.glass@revgeni.ai

---

## 🎯 KEY MESSAGING POINTS

**Frame this as solving a real business problem, not just completing a coding test.**

1. **The Problem is Real**: Sales teams drowning in manual work
2. **The Solution is Complete**: Not just a lead finder—a full CRM
3. **The AI is Practical**: Saves hours of manual research
4. **The Engineering is Solid**: Production patterns, not prototype hacks
5. **The Thinking is Strategic**: Built what users need, not just what was asked for

**Your competitive advantage: You didn't just build features—you built a usable product.**

Good luck! 🚀
