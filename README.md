# RevGeni.ai CRM with AI Lead Generation

An intelligent CRM system with AI-powered lead discovery, pipeline management, and automated email sequences built for the RevGeni.ai technical assessment.

## 🎯 Features

### 1. AI Lead Generation 🤖
- **Neural search** using Exa API to find companies matching criteria
- **AI extraction** with Claude Sonnet 4 to structure company data
- **Duplicate detection** to prevent redundant entries
- **Confidence scoring** to indicate match quality
- Auto-creates companies in CRM with source tracking

### 2. Visual Pipeline Management 📊
- **Kanban board** with 7 deal stages (Prospecting → Won/Lost)
- **Automated workflows** when deals change stages
- **Metrics dashboard** showing deal count and value per stage
- **Smart integrations** with email sequences

### 3. Email Sequences 📧
- **Multi-step sequences** with customizable delays
- **Template variables** support ({{company.name}}, etc.)
- **Automatic pausing** when deals move to active stages
- **Enrollment tracking** per company

### 4. CRM Data Management 🏢
- **Companies** with AI-sourced metadata and confidence scores
- **Deals** with stage progression and automation
- **Events** activity timeline for all interactions
- **Comprehensive search** and filtering

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
3. Click **Find Leads**
4. Results will be automatically created as companies in your CRM
5. Each company shows a confidence score indicating match quality

### Managing Companies

1. Go to **Companies** to view all leads
2. Companies are tagged with:
   - 🤖 **AI Generated** badge if found by AI
   - Status: Lead, Qualified, Customer, Lost
   - Confidence score for AI-sourced leads
3. Click **View Details** to see full company information

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

### Email Sequences

1. Go to **Sequences** to view email automation
2. Create multi-step sequences with delays
3. Use template variables:
   - `{{company.name}}`
   - `{{company.industry}}`
   - `{{person.firstName}}`
4. Enroll companies in sequences
5. Sequences automatically pause when deals reach Demo/Proposal stages

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
│   ├── api/                    # API routes
│   │   ├── companies/          # Company CRUD
│   │   ├── deals/              # Deal management
│   │   ├── events/             # Activity tracking
│   │   ├── sequences/          # Email sequences
│   │   └── ai/find-leads/      # AI lead generation
│   ├── ai-lead-finder/         # AI search interface
│   ├── companies/              # Company management
│   ├── deals/                  # Pipeline board
│   ├── sequences/              # Email sequences
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Base UI components
│   └── layout/                 # Navigation, etc.
├── lib/
│   ├── ai/                     # AI lead finder logic
│   ├── automations/            # Business automations
│   ├── email/                  # Email templates
│   ├── security/               # Duplicate detection
│   ├── utils/                  # Utilities
│   └── prisma.ts               # Database client
├── prisma/
│   └── schema.prisma           # Database schema
└── .env.local                  # Environment variables
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

### Why auto-create companies from AI search?
- Streamlined workflow (search → CRM in one step)
- Duplicate detection prevents redundancy
- Source tracking maintains data provenance

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

1. **AI Lead Generation**:
   - Try: "SaaS companies in London with 50-200 employees"
   - Check that companies are created with confidence scores
   - Verify duplicate detection works

2. **Pipeline Management**:
   - Create a deal from a company
   - Move deal to "Demo" stage
   - Verify automated task creation

3. **Email Sequences**:
   - Create a simple sequence
   - Enroll a company
   - Create a deal and verify sequence pauses

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
