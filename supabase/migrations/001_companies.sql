-- Create companies table
-- This is the first entity in Overlap IQ for tracking company records

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  company_linkedin_url VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on name for search
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Index on domain for lookups
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read companies
DROP POLICY IF EXISTS "Allow read access to companies" ON companies;
CREATE POLICY "Allow read access to companies" ON companies
  FOR SELECT
  USING (true);

-- Policy to allow all authenticated users to insert companies
DROP POLICY IF EXISTS "Allow insert access to companies" ON companies;
CREATE POLICY "Allow insert access to companies" ON companies
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow all authenticated users to update companies
DROP POLICY IF EXISTS "Allow update access to companies" ON companies;
CREATE POLICY "Allow update access to companies" ON companies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy to allow all authenticated users to delete companies
DROP POLICY IF EXISTS "Allow delete access to companies" ON companies;
CREATE POLICY "Allow delete access to companies" ON companies
  FOR DELETE
  USING (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE companies IS 'Companies tracked in Overlap IQ';
COMMENT ON COLUMN companies.id IS 'Unique identifier';
COMMENT ON COLUMN companies.name IS 'Company name';
COMMENT ON COLUMN companies.domain IS 'Company website domain';
COMMENT ON COLUMN companies.created_at IS 'When the record was created';
COMMENT ON COLUMN companies.updated_at IS 'When the record was last updated';
