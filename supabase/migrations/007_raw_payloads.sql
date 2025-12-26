-- Clay person enrichment raw payloads table
-- Stores the complete raw JSON payload from Clay for debugging/reprocessing

CREATE TABLE IF NOT EXISTS clay_person_enrichment_raw_payloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key identifiers for quick lookups
  linkedin_url TEXT UNIQUE,
  name TEXT,
  first_name TEXT,
  last_name TEXT,

  -- Raw payload
  raw_payload JSONB NOT NULL,

  -- When the payload was received
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clay_raw_payloads_linkedin_url ON clay_person_enrichment_raw_payloads(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_clay_raw_payloads_name ON clay_person_enrichment_raw_payloads(name);
CREATE INDEX IF NOT EXISTS idx_clay_raw_payloads_received_at ON clay_person_enrichment_raw_payloads(received_at DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_clay_raw_payloads_payload ON clay_person_enrichment_raw_payloads USING GIN (raw_payload);

-- Enable Row Level Security
ALTER TABLE clay_person_enrichment_raw_payloads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow read access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads;
CREATE POLICY "Allow read access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads;
CREATE POLICY "Allow insert access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads;
CREATE POLICY "Allow update access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads;
CREATE POLICY "Allow delete access to clay_person_enrichment_raw_payloads" ON clay_person_enrichment_raw_payloads
  FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_clay_raw_payloads_updated_at ON clay_person_enrichment_raw_payloads;
CREATE TRIGGER update_clay_raw_payloads_updated_at
  BEFORE UPDATE ON clay_person_enrichment_raw_payloads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
