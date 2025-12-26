# Post-Mortem: Supabase Default Pagination Bug

**Date:** 2025-12-26
**Severity:** Critical
**Impact:** Incorrect data displayed across entire Table View, affecting business decisions

---

## Summary

The Table View page was showing incorrect customer counts and overlap counts for all companies. For example, Merge (merge.dev) displayed **7 customers** when the actual count was **17 customers**, and **27 overlaps** when the actual count was **207 overlaps**.

---

## Root Cause

**Supabase JavaScript client has a default row limit of 1,000 records.**

When querying tables without explicit pagination:
```typescript
// This silently returns only the first 1,000 rows
const { data } = await supabase.from('company_customers').select('*')
```

Our database had:
- **5,667 total records** in `company_customers`
- Only the first **1,000** were being fetched
- Companies whose customers fell outside the first 1,000 rows had incomplete or zero counts

---

## Timeline

1. **Initial implementation**: API routes were written without pagination, assuming Supabase returns all rows
2. **Bug introduced**: As data grew beyond 1,000 records, counts became incorrect
3. **Discovery**: User noticed Merge showing 7 customers instead of expected 17
4. **Investigation**: Direct database query confirmed 17 customers; API returned 7
5. **Root cause identified**: Default 1,000 row limit truncating results
6. **Fix implemented**: Created SQL function with proper aggregation

---

## Technical Details

### Affected APIs
| API | Bug | Impact |
|-----|-----|--------|
| `/api/companies-summary` | Fetched only 1,000 customer records | Customer counts and overlap counts wrong for most companies |
| `/api/overlaps/customers` | Alumni query truncated at 1,000 rows | Alumni counts per customer underreported |
| `/api/overlaps/alumni` | Alumni details truncated at 1,000 rows | Large customers missing alumni |

### Data Volume
```
company_customers: 5,667 records (5.7x over limit)
v_customer_alumni: 100,000+ records (100x over limit)
```

### Why Merge Showed 7 Instead of 17
- Only 7 of Merge's 17 customers happened to be in the first 1,000 rows returned
- The other 10 customers were beyond the default limit

---

## Fix Applied

### 1. Created SQL Function (Migration 013)
```sql
CREATE MATERIALIZED VIEW mv_alumni_counts_by_domain AS
SELECT LOWER(customer_domain), COUNT(DISTINCT person_id)
FROM v_customer_alumni
GROUP BY LOWER(customer_domain);

CREATE FUNCTION get_companies_summary() ...
-- Uses materialized view for fast aggregation
```

### 2. Updated API to Use Function
```typescript
const { data } = await supabase.rpc('get_companies_summary')
```

### 3. Added Pagination to Other APIs
- `/api/overlaps/customers` - Now paginates through all alumni records
- `/api/overlaps/alumni` - Now paginates through all results

---

## Verification

**Before fix:**
```json
{ "name": "Merge", "customer_count": 7, "overlap_count": 27 }
```

**After fix:**
```json
{ "name": "Merge", "customer_count": 17, "overlap_count": 207 }
```

---

## Lessons Learned

### 1. Never Trust Default Limits
Supabase (and most database clients) have default pagination limits:
- **Supabase**: 1,000 rows
- **Firebase**: 1,000 documents
- **DynamoDB**: 1MB response size

Always explicitly handle pagination or use aggregation functions.

### 2. Use Database-Side Aggregation
Instead of:
```typescript
// BAD: Fetches all rows, then counts in JS
const { data } = await supabase.from('table').select('*')
const count = data.filter(...).length
```

Use:
```typescript
// GOOD: Database counts, returns single number
const { data } = await supabase.rpc('get_count_function')
```

### 3. Test with Production-Scale Data
This bug would have been caught if we tested with:
- More than 1,000 customer records
- Companies with customers spread across the dataset

---

## Prevention Measures

### Added to CLAUDE.md:
```markdown
### DO NOT
- Never query Supabase without explicit pagination for tables that may exceed 1,000 rows
- Never assume `.select()` returns all records
```

### Code Pattern to Use:
```typescript
// For large tables, always paginate or use RPC
let allRecords = []
let page = 0
const pageSize = 1000

while (true) {
  const { data } = await supabase
    .from('large_table')
    .select('*')
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (!data || data.length === 0) break
  allRecords = allRecords.concat(data)
  if (data.length < pageSize) break
  page++
}
```

---

## Action Items

- [x] Fix `/api/companies-summary` with SQL function
- [x] Fix `/api/overlaps/customers` with pagination
- [x] Fix `/api/overlaps/alumni` with pagination
- [x] Document pagination requirement in CLAUDE.md
- [ ] Add data freshness indicator (materialized view refresh time)
- [ ] Consider adding automated tests with >1000 record datasets

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/011_companies_summary_function.sql` | Initial function (replaced) |
| `supabase/migrations/012_companies_summary_function_v2.sql` | Optimized function (replaced) |
| `supabase/migrations/013_optimize_overlaps.sql` | Final solution with materialized view |
| `src/app/api/companies-summary/route.ts` | Rewritten to use RPC function |
| `src/app/api/overlaps/customers/route.ts` | Added pagination loop |
| `src/app/api/overlaps/alumni/route.ts` | Added pagination loop |
