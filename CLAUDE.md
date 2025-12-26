# Overlap IQ - AI Agent Onboarding Document

## Project Overview

**Overlap IQ** is a relationship intelligence platform that helps sales teams find warm introduction paths to target companies. The core value proposition: identify people who **used to work at your customers** and now work at companies you want to sell to.

**Tech Stack:**
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4
- **Backend**: Next.js API Routes (server-side), Supabase Edge Functions (Deno)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Data Source**: Clay.com for LinkedIn profile enrichment

**Current State**: Admin view for exploring customer alumni data. Future: Per-company GTM dashboards.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION                               │
│  Clay.com ──POST──► Edge Functions ──► Supabase Tables              │
│  (LinkedIn data)    (ingest-clay-person)  (flattened + work_history)│
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA QUERY                                   │
│  Frontend ──fetch──► API Routes ──► Database Views/Tables           │
│  (React)            (server-side)   (v_customer_alumni)             │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Server-side queries via API routes** - Heavy database queries happen server-side, not in the browser. The frontend only calls `/api/*` endpoints.

2. **Database views for complex joins** - The `v_customer_alumni` view pre-joins person and work history data, with deduplication built in.

3. **Service role key isolation** - The `SUPABASE_SERVICE_ROLE_KEY` is ONLY used in:
   - `/src/lib/supabase-server.ts` (API routes)
   - Edge functions
   - NEVER exposed to the browser

4. **Migrations via `supabase db push`** - All schema changes go through migration files. Never manually edit the database.

5. **Idempotent migrations** - All migrations use `IF NOT EXISTS`, `CREATE OR REPLACE`, and `DROP IF EXISTS` patterns to be re-runnable.

---

## Directory Structure

```
overlap-iq-v1/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard (/)
│   │   ├── layout.tsx          # Root layout with AppShell
│   │   ├── companies/          # Company management (/companies)
│   │   ├── overlaps/           # Main feature (/overlaps)
│   │   ├── table-view/         # Companies summary table (/table-view)
│   │   ├── employers/          # Top past employers (/employers)
│   │   ├── admin/              # Admin page (/admin)
│   │   └── api/                # Server-side API routes
│   │       ├── companies/      # GET /api/companies
│   │       ├── companies-summary/ # GET /api/companies-summary
│   │       ├── employers-summary/ # GET /api/employers-summary
│   │       ├── stats/          # GET /api/stats
│   │       ├── admin/          # POST /api/admin/refresh-alumni-counts
│   │       └── overlaps/
│   │           ├── customers/  # GET /api/overlaps/customers?company_id=
│   │           └── alumni/     # GET /api/overlaps/alumni?customer_domain=
│   ├── components/
│   │   ├── ui/                 # Primitives: Button, Card, Badge, Spinner, SearchInput
│   │   └── layout/             # AppShell, Navbar, Sidebar
│   ├── lib/
│   │   ├── supabase.ts         # Client-side Supabase (anon key)
│   │   └── supabase-server.ts  # Server-side Supabase (service role key)
│   └── types/
│       ├── database.ts         # Database table types
│       └── overlaps.ts         # API response types
├── supabase/
│   ├── migrations/             # SQL migrations (001-010)
│   └── functions/              # Edge Functions (Deno)
│       ├── ingest-company/
│       ├── ingest-company-customers/
│       ├── ingest-clay-person/
│       └── _shared/            # CORS headers
├── .env                        # Environment variables (git-ignored)
└── CLAUDE.md                   # This file
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `companies` | Master company list | `id`, `name`, `domain` (unique) |
| `company_customers` | Customer relationships | `company_id` (FK), `customer_company`, `customer_company_domain` |

### Person Enrichment Tables (from Clay.com)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `clay_person_enrichment_flattened_data` | Person profiles | `id`, `url` (unique), `name`, `headline`, `latest_experience_*` |
| `clay_person_enrichment_work_history_data` | Job history | `person_id` (FK), `company_domain`, `is_current`, `title` |
| `clay_person_enrichment_education_data` | Education | `person_id` (FK), `school_name`, `degree` |
| `clay_person_enrichment_certifications_data` | Certifications | `person_id` (FK), `title`, `company_name` |
| `clay_person_enrichment_raw_payloads` | Raw JSON audit trail | `linkedin_url`, `raw_payload` (JSONB) |

### Database View

**`v_customer_alumni`** - Pre-computed alumni data with deduplication

```sql
-- Returns ONE row per person per customer domain
-- Uses DISTINCT ON to deduplicate
SELECT DISTINCT ON (company_domain, person_id)
  customer_domain, customer_company, person_id, name, headline,
  linkedin_url, past_title, past_start_date, past_end_date,
  current_company, current_title
FROM work_history JOIN flattened_data
WHERE is_current = false
ORDER BY company_domain, person_id, end_date DESC
```

### Migration Files

| File | Purpose |
|------|---------|
| [`001_companies.sql`](supabase/migrations/001_companies.sql) | Companies table |
| [`002_company_customers.sql`](supabase/migrations/002_company_customers.sql) | Customer relationships |
| [`003_people.sql`](supabase/migrations/003_people.sql) | Person flattened data |
| [`004_employment_history.sql`](supabase/migrations/004_employment_history.sql) | Work history |
| [`005_education.sql`](supabase/migrations/005_education.sql) | Education records |
| [`006_certifications.sql`](supabase/migrations/006_certifications.sql) | Certifications |
| [`007_raw_payloads.sql`](supabase/migrations/007_raw_payloads.sql) | Raw JSON storage |
| [`008_overlaps_function.sql`](supabase/migrations/008_overlaps_function.sql) | SQL functions |
| [`009_alumni_view.sql`](supabase/migrations/009_alumni_view.sql) | Alumni view |
| [`010_fix_alumni_view_dedup.sql`](supabase/migrations/010_fix_alumni_view_dedup.sql) | Deduplication fix |
| [`011-013`](supabase/migrations/) | Companies summary function iterations |
| [`014_employers_summary.sql`](supabase/migrations/014_employers_summary.sql) | Past employers function |

---

## API Routes

All API routes are in [`/src/app/api/`](src/app/api/) and use the server-side Supabase client.

### `GET /api/companies`
- **File**: [`src/app/api/companies/route.ts`](src/app/api/companies/route.ts)
- **Response**: `{ companies: [{ id, name, domain }] }`
- **Purpose**: List all companies for sidebar selector

### `GET /api/stats`
- **File**: [`src/app/api/stats/route.ts`](src/app/api/stats/route.ts)
- **Response**: `{ totalCompanies, companiesWithCustomers, totalCustomers, totalPeople, totalWorkHistory }`
- **Purpose**: Dashboard statistics

### `GET /api/companies-summary`
- **File**: [`src/app/api/companies-summary/route.ts`](src/app/api/companies-summary/route.ts)
- **Response**: `{ companies: [{ id, name, domain, customer_count, overlap_count }] }`
- **Purpose**: Table view showing companies with their customer and overlap counts

### `GET /api/employers-summary`
- **File**: [`src/app/api/employers-summary/route.ts`](src/app/api/employers-summary/route.ts)
- **Response**: `{ employers: [{ company_name, company_domain, employee_count }] }`
- **Purpose**: Top past employers by number of people who used to work there

### `POST /api/admin/refresh-alumni-counts`
- **File**: [`src/app/api/admin/refresh-alumni-counts/route.ts`](src/app/api/admin/refresh-alumni-counts/route.ts)
- **Response**: `{ success: true, message, refreshedAt }`
- **Purpose**: Refresh the materialized view for alumni counts

### `GET /api/overlaps/customers?company_id={uuid}`
- **File**: [`src/app/api/overlaps/customers/route.ts`](src/app/api/overlaps/customers/route.ts)
- **Response**: `{ customers: [{ id, customer_company, customer_company_domain, alumni_count }] }`
- **Purpose**: Get customers with alumni counts for a company

### `GET /api/overlaps/alumni?customer_domain={domain}`
- **File**: [`src/app/api/overlaps/alumni/route.ts`](src/app/api/overlaps/alumni/route.ts)
- **Response**: `{ alumni: [{ person_id, name, headline, linkedin_url, past_title, current_company, ... }] }`
- **Purpose**: Get detailed alumni list for a customer

---

## Edge Functions (Data Ingestion)

Edge functions receive webhooks from Clay.com and other sources.

### `POST /functions/v1/ingest-company`
- **File**: [`supabase/functions/ingest-company/index.ts`](supabase/functions/ingest-company/index.ts)
- **Input**: `{ name, domain?, company_linkedin_url? }` or array
- **Behavior**: Upserts company on domain conflict

### `POST /functions/v1/ingest-company-customers`
- **File**: [`supabase/functions/ingest-company-customers/index.ts`](supabase/functions/ingest-company-customers/index.ts)
- **Input**: `{ company_domain, customer_company, customer_company_domain? }`
- **Behavior**: Looks up company by domain, creates customer record

### `POST /functions/v1/ingest-clay-person`
- **File**: [`supabase/functions/ingest-clay-person/index.ts`](supabase/functions/ingest-clay-person/index.ts)
- **Input**: Clay enrichment payload (may be wrapped in `person_raw_enriched_payload`)
- **Required**: `url` (LinkedIn URL)
- **Behavior**:
  1. Store raw payload for audit
  2. Upsert flattened person data on `url`
  3. DELETE + INSERT work history, education, certifications

---

## Principles & How Work Should Be Done

### DO

1. **Use API routes for database queries** - Frontend should only call `/api/*` endpoints, never query Supabase directly for complex operations.

2. **Use `supabase db push` for schema changes** - Create new migration files, never edit the database directly.

3. **Make migrations idempotent** - Use these patterns:
   ```sql
   CREATE TABLE IF NOT EXISTS ...
   CREATE INDEX IF NOT EXISTS ...
   CREATE OR REPLACE VIEW ...
   DROP POLICY IF EXISTS ... ; CREATE POLICY ...
   DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...
   ```

4. **Deduplicate in views, not application code** - Use `DISTINCT ON` in SQL to prevent duplicate rows.

5. **Use the server-side Supabase client for API routes**:
   ```typescript
   import { createServerSupabaseClient } from '@/lib/supabase-server'
   const supabase = createServerSupabaseClient()
   ```

6. **Store domains lowercase** - Always `.toLowerCase()` domains before storing or querying.

7. **Handle errors gracefully** - All API routes should catch errors and return proper status codes.

### DO NOT

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser** - Only use in API routes and edge functions.

2. **Never query Supabase without pagination for large tables** - Supabase has a **default limit of 1,000 rows**. Always use `.range()` pagination or SQL functions for tables that may exceed 1,000 records. See `POSTMORTEM-supabase-pagination.md` for details on this critical bug.

3. **Never deploy edge functions without `--no-verify-jwt`** - External webhooks (Clay, etc.) don't have Supabase JWTs. Always deploy with:
   ```bash
   supabase functions deploy <function-name> --no-verify-jwt
   ```
   Forgetting this causes 401 "Invalid JWT" errors from external callers.

4. **Never use RPC functions for new features** - Use database views + API routes instead. RPC functions require manual SQL deployment. (Exception: aggregation functions for performance like `get_companies_summary`.)

5. **Never query the database client-side for complex joins** - This doesn't scale. Use server-side API routes.

6. **Never manually edit the database** - All changes through migrations.

7. **Never create files unless necessary** - Prefer editing existing files.

8. **Avoid over-engineering** - Keep solutions simple. Don't add features beyond what's requested.

---

## Common Tasks

### Adding a New API Route

1. Create file at `src/app/api/{route}/route.ts`
2. Use server-side Supabase client:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { createServerSupabaseClient } from '@/lib/supabase-server'

   export async function GET(request: NextRequest) {
     try {
       const supabase = createServerSupabaseClient()
       const { data, error } = await supabase.from('table').select('*')
       if (error) throw error
       return NextResponse.json({ data })
     } catch (err) {
       return NextResponse.json({ error: 'Failed' }, { status: 500 })
     }
   }
   ```

### Adding a Database Migration

1. Create file: `supabase/migrations/{number}_{description}.sql`
2. Use idempotent patterns (see above)
3. Run: `supabase db push`
4. Verify with: `supabase migration list`

### Updating an Existing View

Views can't be altered incrementally. Create a new migration with `CREATE OR REPLACE VIEW`.

### Testing API Routes Locally

```bash
npm run dev
curl http://localhost:3000/api/companies
curl "http://localhost:3000/api/overlaps/customers?company_id=UUID"
curl "http://localhost:3000/api/overlaps/alumni?customer_domain=example.com"
```

### Deploying Edge Functions

**IMPORTANT**: Always deploy with `--no-verify-jwt` flag (external webhooks don't have Supabase JWTs):

```bash
supabase functions deploy ingest-clay-person --no-verify-jwt
supabase functions deploy ingest-company --no-verify-jwt
supabase functions deploy ingest-company-customers --no-verify-jwt
```

---

## Environment Variables

Required in `.env`:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Client-side (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Server-side ONLY (keep secret)
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Dashboard | [`src/app/page.tsx`](src/app/page.tsx) |
| Main feature page | [`src/app/overlaps/page.tsx`](src/app/overlaps/page.tsx) |
| Table view page | [`src/app/table-view/page.tsx`](src/app/table-view/page.tsx) |
| Past employers page | [`src/app/employers/page.tsx`](src/app/employers/page.tsx) |
| Admin page | [`src/app/admin/page.tsx`](src/app/admin/page.tsx) |
| Sidebar navigation | [`src/components/layout/sidebar.tsx`](src/components/layout/sidebar.tsx) |
| Server Supabase client | [`src/lib/supabase-server.ts`](src/lib/supabase-server.ts) |
| Client Supabase client | [`src/lib/supabase.ts`](src/lib/supabase.ts) |
| Database types | [`src/types/database.ts`](src/types/database.ts) |
| API types | [`src/types/overlaps.ts`](src/types/overlaps.ts) |
| Alumni view SQL | [`supabase/migrations/010_fix_alumni_view_dedup.sql`](supabase/migrations/010_fix_alumni_view_dedup.sql) |
| Clay ingestion | [`supabase/functions/ingest-clay-person/index.ts`](supabase/functions/ingest-clay-person/index.ts) |

---

## Data Model Conceptual Overview

```
COMPANY (e.g., "Radar")
   │
   ├── has many CUSTOMERS (e.g., "T-Mobile", "Panera")
   │        │
   │        └── matched by domain to WORK_HISTORY
   │                    │
   │                    └── PERSON who used to work there (is_current=false)
   │                            │
   │                            └── now works at CURRENT_COMPANY (from flattened_data)
   │
   └── This creates the "OVERLAP" - warm intro path
```

**The core query logic:**
1. Select a company (Radar)
2. Get their customers (T-Mobile, Panera, etc.)
3. For each customer domain, find people who:
   - Have a work_history record with that domain where `is_current = false`
   - Show their current job from `latest_experience_*` fields
4. These are "alumni" - people who left those customers

---

## Scaling Considerations

Current data volume: ~100k people × ~5 jobs each = ~500k work history records

**Optimizations in place:**
- Database indexes on `company_domain`, `person_id`, `is_current`
- View deduplication with `DISTINCT ON`
- Server-side queries (no client-side data fetching)
- Lazy loading of alumni details (only fetch on expand)

**Future considerations:**
- Materialized views if query performance degrades
- Pagination for large alumni lists
- Caching layer for frequently accessed data

---

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for a detailed log of all build increments and milestones. AI agents should update this file after each meaningful feature completion or bug fix.
