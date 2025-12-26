-- Company customers table
-- Flattened list of each company's customers

CREATE TABLE IF NOT EXISTS company_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_company VARCHAR(255) NOT NULL,
  customer_company_domain VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on company_id for filtering by company
CREATE INDEX IF NOT EXISTS idx_company_customers_company_id ON company_customers(company_id);

-- Index on customer_company_domain for cross-table joins and overlap queries
CREATE INDEX IF NOT EXISTS idx_company_customers_domain ON company_customers(customer_company_domain);

-- Index on customer_company for name searches
CREATE INDEX IF NOT EXISTS idx_company_customers_name ON company_customers(customer_company);

-- Composite index for finding overlaps (domain + company_id)
CREATE INDEX IF NOT EXISTS idx_company_customers_domain_company ON company_customers(customer_company_domain, company_id);

-- Enable Row Level Security
ALTER TABLE company_customers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow read access to company_customers" ON company_customers;
CREATE POLICY "Allow read access to company_customers" ON company_customers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert access to company_customers" ON company_customers;
CREATE POLICY "Allow insert access to company_customers" ON company_customers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to company_customers" ON company_customers;
CREATE POLICY "Allow update access to company_customers" ON company_customers
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete access to company_customers" ON company_customers;
CREATE POLICY "Allow delete access to company_customers" ON company_customers
  FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_company_customers_updated_at ON company_customers;
CREATE TRIGGER update_company_customers_updated_at
  BEFORE UPDATE ON company_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE company_customers IS 'Flattened customer list per company';
COMMENT ON COLUMN company_customers.company_id IS 'The company that has this customer';
COMMENT ON COLUMN company_customers.customer_company IS 'Name of the customer company';
COMMENT ON COLUMN company_customers.customer_company_domain IS 'Domain of the customer company (key for joins)';
