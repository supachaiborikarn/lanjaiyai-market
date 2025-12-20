import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbShop {
    id: string;
    name: string;
    owner_name: string;
    phone: string | null;
    category: string | null;
    stall_number: number | null;
    status: string;
    contract_start: string | null;
    contract_end: string | null;
    monthly_rent: number | null;
    image_url: string | null;
    deposit_amount: number | null;
    deposit_paid_date: string | null;
    deposit_slip_url: string | null;
    advance_rent_months: number | null;
    next_rent_due_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface DbUser {
    id: string;
    username: string;
    password: string;
    role: string;
    shop_id: string | null;
    name: string | null;
    created_at: string;
}

export interface DbMeterReading {
    id: string;
    shop_id: string;
    reading_date: string;
    month: string;
    previous_reading: number;
    current_reading: number;
    units_used: number;
    electricity_cost: number;
    water_cost: number;
    total_cost: number;
    status: string;
    created_at: string;
}

export interface DbPayment {
    id: string;
    shop_id: string;
    meter_reading_id: string | null;
    payment_date: string;
    amount: number;
    type: string;
    description: string | null;
    slip_image_url: string | null;
    slip_verify_status: string;
    slip_verify_note: string | null;
    verified_at: string | null;
    created_at: string;
}

export interface DbRentSlip {
    id: string;
    shop_id: string;
    month: string;
    amount: number | null;
    slip_url: string | null;
    paid_date: string | null;
    note: string | null;
    created_at: string;
}

export interface DbInvoice {
    id: string;
    invoice_number: string;
    shop_id: string;
    month: string;
    items: object;
    total_amount: number;
    paid_amount: number;
    status: string;
    due_date: string;
    sent_at: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DbInvoicePayment {
    id: string;
    invoice_id: string;
    shop_id: string;
    amount: number;
    slip_image_url: string | null;
    payment_date: string;
    status: string;
    verified_by: string | null;
    verified_at: string | null;
    verify_note: string | null;
    created_at: string;
}

export interface DbContract {
    id: string;
    shop_id: string;
    contract_number: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    deposit_amount: number;
    terms: string | null;
    status: string;
    landlord_signature_url: string | null;
    tenant_signature_url: string | null;
    signed_at: string | null;
    created_at: string;
}
