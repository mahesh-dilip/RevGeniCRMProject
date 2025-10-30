# RevGeni.ai CRM with AI Lead Generation

An intelligent CRM system with AI-powered lead discovery, HubSpot-inspired features, pipeline management, and automated email sequences built for the RevGeni.ai technical assessment.

**Latest Update**: Enhanced UI with professional table views, detail pages for all entities, improved deal management, and comprehensive seed data.

## 🆕 Recent Enhancements (October 2024)

### UI/UX Improvements
- ✅ **Professional Table Views** - All list pages (Companies, People, Events, Sequences) now use HubSpot-style tables
- ✅ **Complete Detail Pages** - Added detail pages for Deals, People, and Email Sequences
- ✅ **Enhanced Pipeline Board** - Improved Kanban design with color-coded stages and better visual hierarchy
- ✅ **Horizontal Deal Progress** - Stage progress now displays horizontally with connecting lines
- ✅ **Stats Dashboards** - Key metrics displayed at the top of each list page
- ✅ **Lead Score Visualization** - Progress bars showing lead scores on Companies page
- ✅ **Quick Actions** - Consistent action buttons throughout the application
- ✅ **Improved Navigation** - All entity links now work correctly across the app

### Data & Functionality
- ✅ **Comprehensive Seed Data** - 8 companies, 9 people, 7 deals, 16 events, 3 sequences with realistic demo data
- ✅ **Fixed Schema Issues** - Corrected SequenceEnrollment and ScheduledEmail relationships
- ✅ **Activity Timelines** - Full event history on Company, Deal, and People detail pages
- ✅ **Automation Triggers** - Lead scoring and lifecycle progression on deal/event creation

## 🎯 Features

### 1. AI Lead Generation 🤖
- **Two-step review process**: Search → Review → Confirm workflow
- **Neural search** using Exa API to find companies matching criteria
- **AI extraction** with Claude Sonnet 4 to structure company data
- **Manual selection**: Choose which leads to add with checkboxes
- **Duplicate detection** to prevent redundant entries
- **Confidence scoring** to indicate match quality
- **Bulk import**: Add multiple selected companies at once
- Source tracking for all AI-generated leads

### 2. Company Management 🏢
- **Complete company profiles** with detailed information
- **Tabbed interface**: Overview, People, Deals, Activity
- **Quick stats** showing related records at a glance
- **Activity timeline** displaying all interactions
- **Quick actions** for adding people, deals, and events
- **AI-sourced metadata** with confidence scores
- **Edit and delete** capabilities

### 3. People Management 👥
- **Contact database** with full profile information
- **Company associations** linking contacts to organizations
- **Advanced search** by name, email, or company
- **Contact details**: Email, phone, LinkedIn, job title
- **Activity tracking** showing events per contact
- **Deal associations** showing primary contacts
- **Quick add** from company detail pages

### 4. Visual Pipeline Management 📊
- **Kanban board** with 7 deal stages (Prospecting → Won/Lost)
- **Automated workflows** when deals change stages
- **Metrics dashboard** showing deal count and value per stage
- **Smart integrations** with email sequences
- **Primary contact** assignment per deal
- **Deal value** and probability tracking

### 5. Events & Activities 📅
- **Multi-type events**: Calls, Emails, Meetings, Tasks, Notes
- **Smart filtering**: By status (pending/completed) and type
- **Entity linking**: Associate with companies, people, and deals
- **Due dates** with overdue indicators
- **Priority levels**: High, Medium, Low
- **Quick complete**: Toggle completion status
- **Timeline view** showing full activity history

### 6. Email Sequences 📧
- **Multi-step sequences** with customizable delays
- **Visual sequence builder** for creating campaigns
- **Template variables** support ({{firstName}}, {{company}}, etc.)
- **Automation settings**: Pause on deal creation or specific stages
- **Step management**: Add, remove, reorder email steps
- **Activation control**: Enable/disable sequences
- **Enrollment tracking** per company

### 7. Dashboard 📊
- **Real-time metrics**: Companies, deals, pipeline value
- **Upcoming tasks** with priority indicators
- **Quick actions** for common workflows
- **Activity overview** at a glance
- **Performance indicators**: Won deals, active pipeline

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components

### Backend
- **Prisma ORM** with PostgreSQL
- **Next.js API Routes**
- **Zod** for validation
- **date-fns** for date formatting

### AI
- **Anthropic Claude Sonnet 4** for data extraction
- **Exa API** for neural search

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or hosted like Supabase)
- Exa API key (from https://exa.ai)
- Anthropic API key (from https://console.anthropic.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd revgeieclaudecode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/crm_db?schema=public"

   # AI APIs
   EXA_API_KEY="your-exa-api-key"
   ANTHROPIC_API_KEY="your-anthropic-api-key"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database (creates tables)
   npx prisma db push

   # Seed the database with demo/sample data
   npx prisma db seed

   # Optional: Open Prisma Studio to view data
   npx prisma studio
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Finding AI Leads

1. Navigate to **AI Lead Finder** from the main menu
2. Enter search criteria:
   - **Industry**: e.g., "SaaS", "FinTech", "E-commerce"
   - **Geography**: e.g., "London, UK", "San Francisco, CA"
   - **Company Size**: e.g., "50-200 employees"
   - **Additional Context**: Any extra search criteria
3. Click **Find Leads with AI**
4. **Review the results** - AI will find matching companies
5. **Select companies** to add using checkboxes
   - Use "Select All" / "Deselect All" for quick selection
   - Each company shows a confidence score
6. Click **Add to CRM** to import selected companies
7. Duplicates are automatically detected and skipped

### Managing Companies

1. Go to **Companies** to view all leads
2. Companies are tagged with:
   - 🤖 **AI Generated** badge if found by AI
   - Status: Lead, Qualified, Customer, Lost
   - Confidence score for AI-sourced leads
3. Click **View Details** to see full company information
4. **Company Detail Page** has four tabs:
   - **Overview**: All company info, metadata, quick stats
   - **People**: View and add contacts for this company
   - **Deals**: All associated deals
   - **Activity**: Full timeline of interactions
5. Use **Quick Actions** to add people, deals, or events

### Managing People

1. Navigate to **People** to see all contacts
2. Use the **search bar** to filter by name, email, or company
3. Click **Add Person** to create new contacts
4. Each person shows:
   - Name, title, contact information
   - Associated company (clickable link)
   - Count of deals and events
5. Quick add people from company detail pages

### Tracking Events & Activities

1. Go to **Events** to see all activities
2. Filter by:
   - **Status**: All, Pending, Completed
   - **Type**: Calls, Emails, Meetings, Tasks, Notes
3. Click **Add Event** to log new activities
4. Choose event type and fill in details:
   - Link to company, person, or deal
   - Set due date and priority
   - Add description
5. Mark events as complete with a single click
6. Overdue tasks are highlighted in red

### Pipeline Management

1. Navigate to **Deals** to see your pipeline
2. Deals are organized in columns by stage
3. Each column shows:
   - Number of deals
   - Total value in that stage
4. Move deals between stages to trigger automations:
   - **Demo stage**: Pauses email sequences, creates demo prep task
   - **Proposal stage**: Creates follow-up task
   - **Won stage**: Marks company as Customer, completes sequences
   - **Lost stage**: Can resume nurture sequences

### Creating Email Sequences

1. Go to **Sequences** to view email automation
2. Click **Create Sequence** to start building
3. Fill in sequence details:
   - Name and description
   - Active/inactive status
   - Automation settings
4. **Add email steps**:
   - Click "+ Add Step" to add more emails
   - Set delay days between steps (step 1 is immediate)
   - Write subject and body for each email
5. Use template variables:
   - `{{firstName}}`, `{{lastName}}`
   - `{{company}}`, `{{website}}`
6. **Configure automation**:
   - Pause on deal creation
   - Pause on specific deal stages
7. Enroll companies in sequences
8. Sequences automatically pause based on your settings

## 🔑 Key Technical Features

### AI Integration
- **Retry logic** with exponential backoff for API calls
- **Robust JSON parsing** with fallback handling
- **Validation** using Zod schemas
- **Duplicate detection** before creating companies

### Automation System
- **Deal stage triggers** that fire on stage changes
- **Sequence management** with smart pause/resume
- **Event creation** for activity tracking
- **Task generation** for sales follow-ups

### Database Design
- **Multi-tenancy ready** (simple implementation for demo)
- **Comprehensive indexes** for performance
- **Cascading deletes** for data integrity
- **Flexible event system** supporting multiple entity types

## 📁 Project Structure

```
/revgeieclaudecode
├── app/
│   ├── api/                          # API routes
│   │   ├── companies/                # Company CRUD
│   │   │   ├── route.ts              # List & create companies
│   │   │   ├── [id]/route.ts         # Get, update, delete company
│   │   │   ├── bulk-create/route.ts  # Bulk import with duplicate detection
│   │   │   └── [id]/convert-to-deal/ # Convert company to deal
│   │   ├── people/                   # People management
│   │   │   ├── route.ts              # List & create people
│   │   │   └── [id]/route.ts         # Get, update, delete person
│   │   ├── deals/                    # Deal management
│   │   │   ├── route.ts              # List & create deals
│   │   │   └── [id]/update-stage/    # Update deal stage
│   │   ├── events/                   # Activity tracking
│   │   │   ├── route.ts              # List & create events
│   │   │   ├── [id]/route.ts         # Get, update, delete event
│   │   │   └── quick-log/            # Quick event logging
│   │   ├── sequences/                # Email sequences
│   │   │   └── route.ts              # List & create sequences
│   │   └── ai/find-leads/            # AI lead generation
│   ├── ai-lead-finder/               # AI search interface with selection
│   ├── companies/                    # Company management
│   │   ├── page.tsx                  # Company list (TABLE VIEW with stats)
│   │   └── [id]/page.tsx             # Company detail (tabs: overview, people, deals, activity)
│   ├── people/                       # People management
│   │   ├── page.tsx                  # People list (TABLE VIEW with search)
│   │   ├── [id]/page.tsx             # People detail (NEW - contact info, deals, timeline)
│   │   └── new/page.tsx              # Add new person
│   ├── deals/                        # Pipeline board
│   │   ├── page.tsx                  # Kanban view (ENHANCED with colors)
│   │   ├── [id]/page.tsx             # Deal detail (NEW - horizontal layout)
│   │   └── new/page.tsx              # Create new deal
│   ├── events/                       # Events & activities
│   │   ├── page.tsx                  # Event list (TABLE VIEW with filters)
│   │   └── new/page.tsx              # Create new event
│   ├── sequences/                    # Email sequences
│   │   ├── page.tsx                  # Sequence list (TABLE VIEW with stats)
│   │   ├── [id]/page.tsx             # Sequence detail (NEW - steps, enrollments)
│   │   └── new/page.tsx              # Sequence builder
│   ├── page.tsx                      # Dashboard with metrics
│   └── layout.tsx                    # Root layout with navigation
├── components/
│   ├── ui/                           # Base UI components
│   │   ├── badge.tsx                 # Badge component
│   │   ├── button.tsx                # Button component
│   │   ├── card.tsx                  # Card component
│   │   ├── checkbox.tsx              # Checkbox component
│   │   ├── input.tsx                 # Input component
│   │   ├── label.tsx                 # Label component
│   │   └── textarea.tsx              # Textarea component
│   └── layout/                       # Layout components
│       └── Navigation.tsx            # Main navigation bar
├── lib/
│   ├── ai/                           # AI lead finder logic
│   │   └── lead-finder.ts            # Exa + Claude integration
│   ├── automations/                  # Business automations
│   │   └── deal-stage-triggers.ts    # Deal stage automation
│   ├── email/                        # Email templates
│   ├── security/                     # Security utilities
│   │   └── duplicate-detection.ts    # Duplicate checking
│   ├── utils/                        # Utilities
│   │   ├── cn.ts                     # Class name utility
│   │   └── formatters.ts             # Data formatters
│   └── prisma.ts                     # Database client
├── prisma/
│   └── schema.prisma                 # Database schema
└── .env.local                        # Environment variables
```

## 🤔 Design Decisions

### Why Exa for lead search?
- Neural search better handles fuzzy criteria vs. traditional APIs
- More cost-effective for demonstration purposes
- Part of suggested tech stack

### Why pause sequences on deal creation?
- Prevents spam during active negotiations
- Sales team takes over manual communication
- Sequences can resume if deal is lost (nurture mode)

### Why two-step AI lead finder (search → review → confirm)?
- **User control**: Sales teams can review quality before importing
- **Prevent bad data**: Not all AI results are perfect matches
- **Selective import**: Choose only the most relevant leads
- **Bulk efficiency**: Still faster than manual research
- **Quality over quantity**: Better to import 10 perfect leads than 20 mediocre ones

### Why tabbed company detail page?
- **Organized information**: Separates different data types clearly
- **Reduced clutter**: Only shows relevant information per tab
- **Quick navigation**: Easy to jump to people, deals, or activity
- **Scalability**: Easy to add new tabs (e.g., documents, notes) later

## 🚧 Future Improvements

Given more time, these features would be added:

1. **Real email sending** via SendGrid/Resend integration
2. **Full authentication** with multi-user support
3. **Advanced analytics** dashboard with charts
4. **Drag-and-drop** deal cards in pipeline
5. **Rich text editor** for notes and emails
6. **Export functionality** to CSV/Excel
7. **Mobile app** with React Native
8. **Webhook integrations** for external tools

## 🧪 Testing

To test the application:

1. **Dashboard**:
   - Visit homepage and verify metrics load correctly
   - Check that quick actions navigate to correct pages

2. **AI Lead Generation**:
   - Try: "SaaS companies in London with 50-200 employees"
   - Review the results page
   - Deselect some companies, add others
   - Verify selected companies are created with confidence scores
   - Try adding the same companies again to test duplicate detection

3. **Company Management**:
   - View company detail page
   - Navigate between tabs (Overview, People, Deals, Activity)
   - Add a person from the People tab
   - Add an event from quick actions

4. **People Management**:
   - Navigate to People page
   - Search for a contact by name or email
   - Add a new person
   - Verify they appear on the company detail page

5. **Events & Activities**:
   - Create different event types (call, email, meeting, task, note)
   - Filter by status (pending/completed)
   - Filter by type
   - Mark a task as complete
   - Verify events appear on company timeline

6. **Pipeline Management**:
   - Create a deal from a company
   - Move deal to "Demo" stage
   - Verify automated task creation
   - Check that events appear on company activity tab

7. **Email Sequences**:
   - Create a multi-step sequence
   - Add 3-4 email steps with delays
   - Configure automation settings
   - Verify sequence appears in list

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `EXA_API_KEY` | Exa API key for search | Get from exa.ai |
| `ANTHROPIC_API_KEY` | Claude API key | Get from console.anthropic.com |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

## 🐛 Troubleshooting

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Run `npx prisma db push` to create tables

### AI search not working
- Verify API keys are set in `.env.local`
- Check API key validity
- Ensure you have API credits

### Build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Run `npx prisma generate`

## 📄 License

This project was created for the RevGeni.ai technical assessment.

## 🙏 Acknowledgments

Built with:
- Next.js team for the amazing framework
- Anthropic for Claude AI
- Exa for neural search
- Prisma team for the ORM
- Radix UI for accessible components

---

**Created by:** [Your Name]
**Date:** October 29, 2025
**For:** RevGeni.ai Founding AI Engineer Position
