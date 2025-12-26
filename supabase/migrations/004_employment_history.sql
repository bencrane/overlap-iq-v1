-- Clay person enrichment work history data table
-- Flattened work history from experience[] array, one row per job

CREATE TABLE IF NOT EXISTS clay_person_enrichment_work_history_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES clay_person_enrichment_flattened_data(id) ON DELETE CASCADE,

  -- From experience[] entries
  company_linkedin_url TEXT,
  title TEXT,
  company TEXT,
  company_domain TEXT,
  org_id BIGINT,
  company_id TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN,
  locality TEXT,
  summary TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clay_work_history_person_id ON clay_person_enrichment_work_history_data(person_id);
CREATE INDEX IF NOT EXISTS idx_clay_work_history_company_domain ON clay_person_enrichment_work_history_data(company_domain);
CREATE INDEX IF NOT EXISTS idx_clay_work_history_org_id ON clay_person_enrichment_work_history_data(org_id);
CREATE INDEX IF NOT EXISTS idx_clay_work_history_is_current ON clay_person_enrichment_work_history_data(is_current);
CREATE INDEX IF NOT EXISTS idx_clay_work_history_domain_person ON clay_person_enrichment_work_history_data(company_domain, person_id);

-- Enable Row Level Security
ALTER TABLE clay_person_enrichment_work_history_data ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow read access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data;
CREATE POLICY "Allow read access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data;
CREATE POLICY "Allow insert access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data;
CREATE POLICY "Allow update access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data;
CREATE POLICY "Allow delete access to clay_person_enrichment_work_history_data" ON clay_person_enrichment_work_history_data
  FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_clay_work_history_updated_at ON clay_person_enrichment_work_history_data;
CREATE TRIGGER update_clay_work_history_updated_at
  BEFORE UPDATE ON clay_person_enrichment_work_history_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
