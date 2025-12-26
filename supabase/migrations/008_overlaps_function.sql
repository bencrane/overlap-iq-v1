-- Overlaps function: Find people who currently work at target companies
-- but previously worked at your customers (warm intro paths)

CREATE OR REPLACE FUNCTION get_overlaps_by_target_company(
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  target_company TEXT,
  target_company_domain TEXT,
  overlap_count BIGINT,
  people JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH overlap_people AS (
    SELECT
      current_job.company AS target_company,
      current_job.company_domain AS target_company_domain,
      person.id AS person_id,
      person.name AS person_name,
      person.headline AS person_headline,
      person.url AS linkedin_url,
      current_job.title AS current_title,
      past_job.company AS customer_company,
      past_job.company_domain AS customer_domain,
      past_job.title AS past_title,
      past_job.start_date AS customer_start_date,
      past_job.end_date AS customer_end_date
    FROM clay_person_enrichment_flattened_data person
    -- Join to get their current job
    INNER JOIN clay_person_enrichment_work_history_data current_job
      ON current_job.person_id = person.id
      AND current_job.is_current = true
    -- Join to get past jobs
    INNER JOIN clay_person_enrichment_work_history_data past_job
      ON past_job.person_id = person.id
      AND past_job.is_current = false
    -- Match past job to customer list
    INNER JOIN company_customers cc
      ON LOWER(cc.customer_company_domain) = LOWER(past_job.company_domain)
    WHERE
      -- Ensure current job has a company name
      current_job.company IS NOT NULL
      AND current_job.company != ''
      -- Ensure current job is different from past customer job
      AND current_job.company_domain IS DISTINCT FROM past_job.company_domain
      -- Optional search filter
      AND (
        p_search_term IS NULL
        OR current_job.company ILIKE '%' || p_search_term || '%'
        OR person.name ILIKE '%' || p_search_term || '%'
      )
  )
  SELECT
    op.target_company,
    op.target_company_domain,
    COUNT(DISTINCT op.person_id) AS overlap_count,
    JSONB_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'person_id', op.person_id,
        'name', op.person_name,
        'headline', op.person_headline,
        'linkedin_url', op.linkedin_url,
        'current_title', op.current_title,
        'customer_company', op.customer_company,
        'past_title', op.past_title
      )
    ) AS people
  FROM overlap_people op
  GROUP BY op.target_company, op.target_company_domain
  ORDER BY COUNT(DISTINCT op.person_id) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add index to optimize domain matching (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_customers_domain_lower
  ON company_customers(LOWER(customer_company_domain));

-- ============================================================
-- Function: Get customers with alumni counts for a company
-- ============================================================
CREATE OR REPLACE FUNCTION get_customers_with_alumni(
  p_company_id UUID
)
RETURNS TABLE (
  customer_id UUID,
  customer_company TEXT,
  customer_company_domain TEXT,
  alumni_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id AS customer_id,
    cc.customer_company,
    cc.customer_company_domain,
    COUNT(DISTINCT wh.person_id) AS alumni_count
  FROM company_customers cc
  LEFT JOIN clay_person_enrichment_work_history_data wh
    ON LOWER(wh.company_domain) = LOWER(cc.customer_company_domain)
    AND wh.is_current = false
  WHERE cc.company_id = p_company_id
  GROUP BY cc.id, cc.customer_company, cc.customer_company_domain
  ORDER BY COUNT(DISTINCT wh.person_id) DESC, cc.customer_company ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Function: Get alumni details for a specific customer domain
-- ============================================================
CREATE OR REPLACE FUNCTION get_customer_alumni(
  p_customer_domain TEXT
)
RETURNS TABLE (
  person_id UUID,
  name TEXT,
  headline TEXT,
  linkedin_url TEXT,
  past_title TEXT,
  past_start_date DATE,
  past_end_date DATE,
  current_company TEXT,
  current_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    person.id AS person_id,
    person.name,
    person.headline,
    person.url AS linkedin_url,
    past_job.title AS past_title,
    past_job.start_date AS past_start_date,
    past_job.end_date AS past_end_date,
    current_job.company AS current_company,
    current_job.title AS current_title
  FROM clay_person_enrichment_flattened_data person
  -- Past job at the customer
  INNER JOIN clay_person_enrichment_work_history_data past_job
    ON past_job.person_id = person.id
    AND LOWER(past_job.company_domain) = LOWER(p_customer_domain)
    AND past_job.is_current = false
  -- Current job (optional - they might not have one listed)
  LEFT JOIN clay_person_enrichment_work_history_data current_job
    ON current_job.person_id = person.id
    AND current_job.is_current = true
    AND current_job.company IS NOT NULL
    AND current_job.company != ''
  ORDER BY past_job.end_date DESC NULLS LAST, person.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;
