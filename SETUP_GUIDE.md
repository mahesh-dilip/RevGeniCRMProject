# Quick Setup Guide

## ✅ What's Already Done

The entire RevGeni.ai CRM application has been implemented with all core features:

- ✅ Next.js 14 project with TypeScript and Tailwind CSS
- ✅ Complete Prisma database schema
- ✅ AI lead generation with Exa + Claude
- ✅ Full CRM API routes (Companies, Deals, Events, Sequences)
- ✅ Pipeline management with automation
- ✅ Email sequences with template variables
- ✅ UI components and pages
- ✅ Seed script for demo data
- ✅ Build verified successfully

## 🚀 Next Steps to Run the Application

### 1. Get API Keys

You'll need to obtain:

**Exa API Key:**
1. Go to https://exa.ai
2. Sign up for a free account
3. Get your API key from the dashboard

**Anthropic API Key:**
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Create a new API key
4. Add $5-10 credit for testing

### 2. Set Up Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
# or use your package manager

# Create database
createdb crm_db

# Update .env.local with:
DATABASE_URL="postgresql://localhost:5432/crm_db?schema=public"
```

**Option B: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Update .env.local with the connection string

### 3. Configure Environment Variables

Edit `.env.local` and add your keys:

```env
# Database (update with your actual connection string)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# AI APIs (add your actual keys)
EXA_API_KEY="your-exa-api-key-here"
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# App (already configured)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database

```bash
# Generate Prisma client (already done, but run again after env setup)
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# (Optional) Seed with demo data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your CRM!

## 📱 Using the Application

### First Steps:

1. **Find AI Leads**
   - Go to "AI Lead Finder"
   - Try: "SaaS companies in London with 50-200 employees"
   - Watch AI create companies automatically

2. **View Companies**
   - Go to "Companies" to see all leads
   - Notice AI-generated companies have confidence scores

3. **Create Deals**
   - Click on a company
   - Convert to deal to start tracking

4. **Manage Pipeline**
   - Go to "Deals" to see Kanban board
   - Drag deals between stages
   - Watch automations trigger

5. **Email Sequences**
   - Go to "Sequences"
   - Create automated email campaigns
   - Enroll companies

## 🐛 Troubleshooting

**"API key must be provided" error:**
- Check .env.local has correct API keys
- Restart dev server after adding keys

**Database connection errors:**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database exists

**Build errors:**
- Delete `.next` folder
- Run `npm install` again
- Run `npx prisma generate`

## 📚 Learn More

See README.md for:
- Complete feature documentation
- Technical architecture details
- Design decisions
- API documentation

## 🎯 Ready to Deploy?

```bash
# Build for production
npm run build

# Start production server
npm start
```

Or deploy to Vercel:
```bash
vercel deploy
```

## 💡 Tips

- Use Prisma Studio to view data: `npx prisma studio`
- Check API routes at http://localhost:3000/api/*
- All pages are server-rendered where possible
- Client components use 'use client' directive

---

**Need Help?** Check the comprehensive README.md or the project documentation!
