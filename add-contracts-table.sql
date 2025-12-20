-- Contracts Table Migration
-- Run this script in Supabase SQL Editor to add the contracts table

-- Contracts table (สัญญาเช่าร้านค้า)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  terms TEXT,
  status TEXT DEFAULT 'draft', -- draft, pending_signature, signed, expired, cancelled
  landlord_signature_url TEXT,
  tenant_signature_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for development)
CREATE POLICY "Allow all for contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);
