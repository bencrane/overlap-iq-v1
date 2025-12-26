-- Clay person enrichment flattened data table
-- Stores enriched person data from LinkedIn with all flat fields + latest_experience

CREATE TABLE IF NOT EXISTS clay_person_enrichment_flattened_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Root level flat fields
  dob TEXT,
  org TEXT,
  url TEXT UNIQUE,  -- LinkedIn URL, unique identifier
  name TEXT,
  slug TEXT,
  title TEXT,
  awards TEXT,
  country TEXT,
  courses TEXT,
  summary TEXT,
  user_id TEXT,
  headline TEXT,
  projects TEXT,
  languages TEXT,
  last_name TEXT,
  person_id TEXT,
  first_name TEXT,
  jobs_count INTEGER,
  profile_id BIGINT,
  connections INTEGER,
  last_refresh TIMESTAMPTZ,
  others_named TEXT,
  publications TEXT,
  volunteering TEXT,
  location_name TEXT,
  num_followers INTEGER,
  patents TEXT,
  picture_url_copy TEXT,
  picture_url_orig TEXT,
  people_also_viewed TEXT,

  -- From latest_experience object
  latest_experience_url TEXT,
  latest_experience_title TEXT,
  latest_experience_company TEXT,
  latest_experience_company_domain TEXT,
  latest_experience_org_id BIGINT,
  latest_experience_start_date DATE,
  latest_experience_end_date DATE,
  latest_experience_locality TEXT,
  latest_experience_is_current BOOLEAN,
  latest_experience_summary TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clay_person_flattened_url ON clay_person_enrichment_flattened_data(url);
CREATE INDEX IF NOT EXISTS idx_clay_person_flattened_profile_id ON clay_person_enrichment_flattened_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_clay_person_flattened_latest_company_domain ON clay_person_enrichment_flattened_data(latest_experience_company_domain);
CREATE INDEX IF NOT EXISTS idx_clay_person_flattened_org ON clay_person_enrichment_flattened_data(org);
CREATE INDEX IF NOT EXISTS idx_clay_person_flattened_name ON clay_person_enrichment_flattened_data(name);

-- Enable Row Level Security
ALTER TABLE clay_person_enrichment_flattened_data ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow read access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data;
CREATE POLICY "Allow read access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data;
CREATE POLICY "Allow insert access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data;
CREATE POLICY "Allow update access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data;
CREATE POLICY "Allow delete access to clay_person_enrichment_flattened_data" ON clay_person_enrichment_flattened_data
  FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_clay_person_flattened_updated_at ON clay_person_enrichment_flattened_data;
CREATE TRIGGER update_clay_person_flattened_updated_at
  BEFORE UPDATE ON clay_person_enrichment_flattened_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
