# Changelog

All notable changes and build milestones for Overlap IQ are documented in this file.

**Format:** Each entry includes the date, a brief description, and files affected.

---

## 2025-12-26

### Past Employers Page
Added a new page showing companies that appear most frequently as past employers in the database.

**Files created:**
- `src/app/employers/page.tsx` - Sortable table showing top past employers with employee counts
- `src/app/api/employers-summary/route.ts` - API using SQL function for efficient aggregation
- `supabase/migrations/014_employers_summary.sql` - SQL function to aggregate past employer data

**Files modified:**
- `src/components/layout/sidebar.tsx` - Added "Past Employers" link with briefcase icon

---

### Admin Page with Refresh Button
Added an Admin page with a button to refresh the materialized view that caches alumni counts.

**Files created:**
- `src/app/admin/page.tsx` - Admin page with refresh button
- `src/app/api/admin/refresh-alumni-counts/route.ts` - API to trigger materialized view refresh

**Files modified:**
- `src/components/layout/sidebar.tsx` - Added Admin link with settings icon

---

### CRITICAL: Supabase Pagination Bug Fix
Fixed a critical bug where customer counts and overlap counts were severely underreported due to Supabase's default 1,000 row limit. For example, Merge showed 7 customers instead of 17, and 27 overlaps instead of 207.

**Root cause:** Supabase JavaScript client silently truncates results to 1,000 rows by default.

**Solution:** Created optimized SQL function with materialized view for aggregation.

**Files created:**
- `supabase/migrations/011_companies_summary_function.sql` - Initial function (superseded)
- `supabase/migrations/012_companies_summary_function_v2.sql` - Optimized function (superseded)
- `supabase/migrations/013_optimize_overlaps.sql` - Final solution with materialized view
- `POSTMORTEM-supabase-pagination.md` - Full post-mortem analysis

**Files modified:**
- `src/app/api/companies-summary/route.ts` - Rewritten to use efficient RPC function
- `src/app/api/overlaps/customers/route.ts` - Added pagination for >1000 row support
- `src/app/api/overlaps/alumni/route.ts` - Added pagination for >1000 row support
- `CLAUDE.md` - Added DO NOT rule about Supabase pagination

---

## 2025-12-25

### Table View Feature
Added a new Table View page showing all companies with customers, their customer counts, and overlap counts (alumni who worked at those customers).

**Files created:**
- `src/app/table-view/page.tsx` - Sortable table with search, columns: Company, Domain, Customers, Overlaps
- `src/app/api/companies-summary/route.ts` - API aggregating customer and overlap counts per company

**Files modified:**
- `src/components/layout/sidebar.tsx` - Added "Table View" navigation link

---

### Dashboard Stats
Updated the dashboard to show real statistics from the database.

**Files modified:**
- `src/app/page.tsx` - Dashboard now shows: Total Companies, With Customers, Total Customers, People Enriched

**Files created:**
- `src/app/api/stats/route.ts` - API returning aggregate statistics

---

### Company Search in Overlaps Sidebar
Added search functionality to filter companies in the overlaps page sidebar.

**Files modified:**
- `src/app/overlaps/page.tsx` - Added `SearchInput` component to filter company list

---

### Alumni View Deduplication Fix
Fixed duplicate people appearing in alumni lists by adding `DISTINCT ON` to the database view.

**Files created:**
- `supabase/migrations/010_fix_alumni_view_dedup.sql` - View now deduplicates on (company_domain, person_id)

---

### Date Normalization for Clay Ingestion
Fixed date format errors when Clay sends partial dates like "2025-02" instead of "2025-02-01".

**Files modified:**
- `supabase/functions/ingest-clay-person/index.ts` - Added `normalizeDate()` function to handle YYYY-MM and YYYY formats

---

### JWT Verification Disabled for Edge Functions
Fixed 401 "Invalid JWT" errors from external webhooks by deploying all edge functions with `--no-verify-jwt`.

**Deployment command:**
```bash
supabase functions deploy <function-name> --no-verify-jwt
```

---

### Idempotent Migrations
Fixed migration failures by making all migrations re-runnable with proper `DROP IF EXISTS` patterns before policies and triggers.

**Files modified:**
- Various migration files updated with `DROP POLICY IF EXISTS` and `DROP TRIGGER IF EXISTS`

---

### Initial Overlaps Feature
Built the core overlaps feature with server-side architecture.

**Files created:**
- `src/app/overlaps/page.tsx` - Main overlaps page with company selector, customer list, and expandable alumni
- `src/app/api/companies/route.ts` - Companies list API
- `src/app/api/overlaps/customers/route.ts` - Customers with alumni counts API
- `src/app/api/overlaps/alumni/route.ts` - Alumni details API
- `src/lib/supabase-server.ts` - Server-side Supabase client
- `supabase/migrations/009_alumni_view.sql` - Initial alumni view

---

## How to Update This File

After completing a meaningful feature or bug fix, add an entry at the top of this file (below the header) with:

1. **Date** (YYYY-MM-DD format)
2. **Section title** describing the change
3. **Brief description** of what was done and why
4. **Files created/modified** list

Example:
```markdown
## 2025-12-26

### Feature Name
Brief description of the feature or fix.

**Files created:**
- `path/to/new/file.ts` - Description

**Files modified:**
- `path/to/existing/file.ts` - What changed
```
