# Issue: Alumni Count Mismatch

## Problem Summary

The Overlaps page shows **322 alumni** for T-Mobile, but direct database queries show only **101 records** in the work_history table for that domain.

## Observed Behavior

1. **Overlaps UI** (`/overlaps`): Shows T-Mobile with 322 alumni
2. **API Response** (`/api/overlaps/customers`): Returns `alumni_count: 322` for T-Mobile
3. **API Response** (`/api/overlaps/alumni?customer_domain=t-mobile.com`): Returns 322 records
4. **Direct DB Query** (user verified in Supabase dashboard):
   - `clay_person_enrichment_flattened_data` filtered by `latest_experience_company = "T-Mobile"` → **8 records**
   - `clay_person_enrichment_work_history_data` filtered by `company_domain = "t-mobile.com"` → **101 records**

## Expected Behavior

The alumni count should be ≤ 101 (the number of work_history records for that domain), and likely less since:
- The view filters `is_current = false` (past jobs only)
- The view uses `DISTINCT ON (company_domain, person_id)` to deduplicate

## Relevant Files

### Database View (the likely culprit)
- **Migration**: [`supabase/migrations/010_fix_alumni_view_dedup.sql`](supabase/migrations/010_fix_alumni_view_dedup.sql)

```sql
CREATE OR REPLACE VIEW v_customer_alumni AS
SELECT DISTINCT ON (wh.company_domain, p.id)
  wh.company_domain AS customer_domain,
  ...
FROM clay_person_enrichment_work_history_data wh
INNER JOIN clay_person_enrichment_flattened_data p ON p.id = wh.person_id
WHERE wh.is_current = false
  AND wh.company_domain IS NOT NULL
ORDER BY wh.company_domain, p.id, wh.end_date DESC NULLS LAST;
```

### API Routes
- **Customers API**: [`src/app/api/overlaps/customers/route.ts`](src/app/api/overlaps/customers/route.ts)
  - Queries view with `.in('customer_domain', domains)` and counts rows per domain

- **Alumni API**: [`src/app/api/overlaps/alumni/route.ts`](src/app/api/overlaps/alumni/route.ts)
  - Queries view with `.ilike('customer_domain', customerDomain)`

### New Employers API (for comparison)
- **Employers API**: [`src/app/api/employers/route.ts`](src/app/api/employers/route.ts)
  - Queries work_history table directly, aggregates by company/domain
  - Shows max ~11 records for top companies (Salesforce, Medallia)
  - **T-Mobile doesn't even appear** in this aggregation

## Hypotheses

1. **Migration 010 may not have been applied** - The view might still be the old version without `DISTINCT ON`

2. **Case sensitivity / domain matching issue** - The `.ilike()` query might be matching more than expected, or domains are stored with different cases

3. **View is joining incorrectly** - The JOIN might be producing a cartesian product somehow

4. **Multiple domain variations** - There might be "t-mobile.com", "T-Mobile.com", "tmobile.com" etc. all being counted

## Investigation Steps to Try

1. **Verify migration was applied**:
   ```bash
   supabase migration list
   ```

2. **Query the view directly in Supabase SQL Editor**:
   ```sql
   SELECT COUNT(*) FROM v_customer_alumni WHERE customer_domain ILIKE 't-mobile.com';
   ```

3. **Check for domain variations**:
   ```sql
   SELECT DISTINCT customer_domain
   FROM v_customer_alumni
   WHERE customer_domain ILIKE '%mobile%';
   ```

4. **Verify DISTINCT ON is working**:
   ```sql
   SELECT customer_domain, person_id, COUNT(*)
   FROM v_customer_alumni
   WHERE customer_domain ILIKE 't-mobile.com'
   GROUP BY customer_domain, person_id
   HAVING COUNT(*) > 1;
   ```
   (Should return 0 rows if dedup is working)

5. **Compare raw work_history count**:
   ```sql
   SELECT COUNT(DISTINCT person_id)
   FROM clay_person_enrichment_work_history_data
   WHERE company_domain ILIKE 't-mobile.com' AND is_current = false;
   ```

## Additional Context

- The Employers API (newly created, queries work_history directly) shows realistic numbers (max ~11 per company)
- The Overlaps API (queries the view) shows inflated numbers (322 for T-Mobile)
- This suggests the issue is with the view, not the underlying data

## Files Changed Recently

- `supabase/migrations/009_alumni_view.sql` - Original view
- `supabase/migrations/010_fix_alumni_view_dedup.sql` - Dedup fix (may not be applied)
- `src/app/api/overlaps/customers/route.ts` - Customers API
- `src/app/api/overlaps/alumni/route.ts` - Alumni API
