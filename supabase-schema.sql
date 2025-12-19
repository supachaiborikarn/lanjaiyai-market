-- ลานใจใหญ่ Market Management System
-- Run this script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  stall_number INTEGER,
  status TEXT DEFAULT 'active',
  contract_start DATE,
  contract_end DATE,
  monthly_rent DECIMAL(10,2),
  image_url TEXT,
  deposit_amount DECIMAL(10,2),
  deposit_paid_date DATE,
  deposit_slip_url TEXT,
  advance_rent_months INTEGER DEFAULT 0,
  next_rent_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'shop_owner',
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meter readings table
CREATE TABLE IF NOT EXISTS meter_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  month TEXT NOT NULL,
  previous_reading DECIMAL(10,2) DEFAULT 0,
  current_reading DECIMAL(10,2) DEFAULT 0,
  units_used DECIMAL(10,2) DEFAULT 0,
  electricity_cost DECIMAL(10,2) DEFAULT 0,
  water_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  meter_reading_id UUID REFERENCES meter_readings(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT DEFAULT 'rent',
  description TEXT,
  slip_image_url TEXT,
  slip_verify_status TEXT DEFAULT 'pending',
  slip_verify_note TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rent slips table
CREATE TABLE IF NOT EXISTS rent_slips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount DECIMAL(10,2),
  slip_url TEXT,
  paid_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  due_date DATE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (but allow all for now)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development)
CREATE POLICY "Allow all for shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for meter_readings" ON meter_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for rent_slips" ON rent_slips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user
INSERT INTO users (username, password, role, name)
VALUES ('admin', 'admin123', 'admin', 'ผู้ดูแลระบบ')
ON CONFLICT (username) DO NOTHING;
