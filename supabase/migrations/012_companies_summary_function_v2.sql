-- Drop the slow function and recreate with optimized query
DROP FUNCTION IF EXISTS get_companies_summary();

-- Efficient function that returns companies with counts
-- Uses direct joins instead of array manipulation
CREATE OR REPLACE FUNCTION get_companies_summary()
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  customer_count BIGINT,
  overlap_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  WITH customer_counts AS (
    -- Simple customer count per company
    SELECT
      company_id,
      COUNT(*) AS customer_count
    FROM company_customers
    GROUP BY company_id
  ),
  company_overlaps AS (
    -- Count DISTINCT people per company (across all their customer domains)
    SELECT
      cc.company_id,
      COUNT(DISTINCT va.person_id) AS overlap_count
    FROM company_customers cc
    INNER JOIN v_customer_alumni va
      ON LOWER(va.customer_domain) = LOWER(cc.customer_company_domain)
    GROUP BY cc.company_id
  )
  SELECT
    c.id,
    c.name,
    c.domain,
    COALESCE(cust.customer_count, 0)::BIGINT AS customer_count,
    COALESCE(ovlp.overlap_count, 0)::BIGINT AS overlap_count
  FROM companies c
  INNER JOIN customer_counts cust ON cust.company_id = c.id
  LEFT JOIN company_overlaps ovlp ON ovlp.company_id = c.id
  ORDER BY ovlp.overlap_count DESC NULLS LAST, c.name;
$$;
