-- Clay person enrichment education data table
-- Flattened education history from education[] array, one row per school/degree

CREATE TABLE IF NOT EXISTS clay_person_enrichment_education_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES clay_person_enrichment_flattened_data(id) ON DELETE CASCADE,

  -- From education[] entries
  school_name TEXT,
  degree TEXT,
  field_of_study TEXT,
  grade TEXT,
  activities TEXT,
  start_date DATE,
  end_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clay_education_person_id ON clay_person_enrichment_education_data(person_id);
CREATE INDEX IF NOT EXISTS idx_clay_education_school_name ON clay_person_enrichment_education_data(school_name);
CREATE INDEX IF NOT EXISTS idx_clay_education_degree ON clay_person_enrichment_education_data(degree);

-- Enable Row Level Security
ALTER TABLE clay_person_enrichment_education_data ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow read access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data;
CREATE POLICY "Allow read access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data;
CREATE POLICY "Allow insert access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data;
CREATE POLICY "Allow update access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data;
CREATE POLICY "Allow delete access to clay_person_enrichment_education_data" ON clay_person_enrichment_education_data
  FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_clay_education_updated_at ON clay_person_enrichment_education_data;
CREATE TRIGGER update_clay_education_updated_at
  BEFORE UPDATE ON clay_person_enrichment_education_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
