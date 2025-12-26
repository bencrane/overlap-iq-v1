-- Function to get top past employers (companies people used to work at)
CREATE OR REPLACE FUNCTION get_top_past_employers(limit_count INT DEFAULT 500)
RETURNS TABLE (
  company_name TEXT,
  company_domain TEXT,
  employee_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COALESCE(wh.company, wh.company_domain) AS company_name,
    wh.company_domain,
    COUNT(DISTINCT wh.person_id) AS employee_count
  FROM clay_person_enrichment_work_history_data wh
  WHERE wh.is_current = false
    AND (wh.company IS NOT NULL OR wh.company_domain IS NOT NULL)
  GROUP BY COALESCE(wh.company, wh.company_domain), wh.company_domain
  ORDER BY COUNT(DISTINCT wh.person_id) DESC
  LIMIT limit_count;
$$;
