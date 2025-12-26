-- Function to get companies summary with customer and overlap counts
-- This is much more efficient than fetching all rows client-side

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
    SELECT
      company_id,
      COUNT(*) AS customer_count,
      ARRAY_AGG(LOWER(customer_company_domain)) FILTER (WHERE customer_company_domain IS NOT NULL) AS customer_domains
    FROM company_customers
    GROUP BY company_id
  ),
  alumni_by_domain AS (
    SELECT
      LOWER(customer_domain) AS customer_domain,
      COUNT(DISTINCT person_id) AS alumni_count
    FROM v_customer_alumni
    WHERE customer_domain IS NOT NULL
    GROUP BY LOWER(customer_domain)
  ),
  company_overlaps AS (
    SELECT
      cc.company_id,
      COALESCE(SUM(abd.alumni_count), 0) AS overlap_count
    FROM customer_counts cc
    CROSS JOIN LATERAL UNNEST(cc.customer_domains) AS domain
    LEFT JOIN alumni_by_domain abd ON abd.customer_domain = domain
    GROUP BY cc.company_id
  )
  SELECT
    c.id,
    c.name,
    c.domain,
    COALESCE(cc.customer_count, 0) AS customer_count,
    COALESCE(co.overlap_count, 0) AS overlap_count
  FROM companies c
  INNER JOIN customer_counts cc ON cc.company_id = c.id
  LEFT JOIN company_overlaps co ON co.company_id = c.id
  WHERE cc.customer_count > 0
  ORDER BY co.overlap_count DESC NULLS LAST, c.name;
$$;
