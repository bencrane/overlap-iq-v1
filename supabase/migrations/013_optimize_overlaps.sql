-- Add index to v_customer_alumni's underlying table for domain lookups
CREATE INDEX IF NOT EXISTS idx_work_history_company_domain_lower
  ON clay_person_enrichment_work_history_data (LOWER(company_domain))
  WHERE is_current = false AND company_domain IS NOT NULL;

-- Add index on company_customers for domain lookups
CREATE INDEX IF NOT EXISTS idx_company_customers_domain_lower
  ON company_customers (LOWER(customer_company_domain))
  WHERE customer_company_domain IS NOT NULL;

-- Create materialized view for alumni counts by domain (much faster)
DROP MATERIALIZED VIEW IF EXISTS mv_alumni_counts_by_domain;

CREATE MATERIALIZED VIEW mv_alumni_counts_by_domain AS
SELECT
  LOWER(customer_domain) AS customer_domain,
  COUNT(DISTINCT person_id) AS alumni_count
FROM v_customer_alumni
WHERE customer_domain IS NOT NULL
GROUP BY LOWER(customer_domain);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_mv_alumni_domain ON mv_alumni_counts_by_domain(customer_domain);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_alumni_counts()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_alumni_counts_by_domain;
$$;

-- Drop and recreate the summary function to use the materialized view
DROP FUNCTION IF EXISTS get_companies_summary();

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
  SELECT
    c.id,
    c.name,
    c.domain,
    COUNT(DISTINCT cc.id)::BIGINT AS customer_count,
    COALESCE(SUM(COALESCE(mac.alumni_count, 0)), 0)::BIGINT AS overlap_count
  FROM companies c
  INNER JOIN company_customers cc ON cc.company_id = c.id
  LEFT JOIN mv_alumni_counts_by_domain mac ON mac.customer_domain = LOWER(cc.customer_company_domain)
  GROUP BY c.id, c.name, c.domain
  ORDER BY COALESCE(SUM(COALESCE(mac.alumni_count, 0)), 0) DESC, c.name;
$$;
