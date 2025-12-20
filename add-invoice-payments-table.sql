-- Invoice Payment System Migration
-- Run this script in Supabase SQL Editor to add the new table

-- Invoice Payments table (for slip-based payment verification)
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  slip_image_url TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, verified, rejected
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verify_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for development)
CREATE POLICY "Allow all for invoice_payments" ON invoice_payments FOR ALL USING (true) WITH CHECK (true);
