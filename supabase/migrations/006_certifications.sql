-- Clay person enrichment certifications data table
-- Flattened certifications from certifications[] array, one row per certification

CREATE TABLE IF NOT EXISTS clay_person_enrichment_certifications_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES clay_person_enrichment_flattened_data(id) ON DELETE CASCADE,

  -- From certifications[] entries
  title TEXT,
  company_name TEXT,
  company_id TEXT,
  date DATE,
  credential_id TEXT,
  verify_url TEXT,
  summary TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clay_certifications_person_id ON clay_person_enrichment_certifications_data(person_id);
CREATE INDEX IF NOT EXISTS idx_clay_certifications_title ON clay_person_enrichment_certifications_data(title);
CREATE INDEX IF NOT EXISTS idx_clay_certifications_company_name ON clay_person_enrichment_certifications_data(company_name);

-- Enable Row Level Security
ALTER TABLE clay_person_enrichment_certifications_data ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow read access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data;
CREATE POLICY "Allow read access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data;
CREATE POLICY "Allow insert access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data;
CREATE POLICY "Allow update access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data;
CREATE POLICY "Allow delete access to clay_person_enrichment_certifications_data" ON clay_person_enrichment_certifications_data
  FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_clay_certifications_updated_at ON clay_person_enrichment_certifications_data;
CREATE TRIGGER update_clay_certifications_updated_at
  BEFORE UPDATE ON clay_person_enrichment_certifications_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
