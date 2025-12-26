-- Fix: Deduplicate alumni view to return ONE row per person per customer
-- Previously returned multiple rows when person had multiple current jobs

CREATE OR REPLACE VIEW v_customer_alumni AS
SELECT DISTINCT ON (wh.company_domain, p.id)
  wh.company_domain AS customer_domain,
  wh.company AS customer_company,
  p.id AS person_id,
  p.name,
  p.headline,
  p.url AS linkedin_url,
  wh.title AS past_title,
  wh.start_date AS past_start_date,
  wh.end_date AS past_end_date,
  -- Use the flattened table's latest_experience for current job (single source of truth)
  p.latest_experience_company AS current_company,
  p.latest_experience_title AS current_title
FROM clay_person_enrichment_work_history_data wh
INNER JOIN clay_person_enrichment_flattened_data p ON p.id = wh.person_id
WHERE wh.is_current = false
  AND wh.company_domain IS NOT NULL
ORDER BY wh.company_domain, p.id, wh.end_date DESC NULLS LAST;
