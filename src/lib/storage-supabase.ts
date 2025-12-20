import { supabase, DbShop, DbUser, DbMeterReading, DbPayment, DbRentSlip, DbInvoice, DbInvoicePayment, DbContract } from './supabase';
import { User, Shop, MeterReading, Payment, Invoice, InvoiceItem, InvoicePayment, RentSlip, Contract, ContractStatus, ELECTRICITY_RATE, WATER_FLAT_RATE } from '@/types';

// ==================== Helper Functions ====================
function dbShopToShop(db: DbShop): Shop {
    return {
        id: db.id,
        name: db.name,
        ownerName: db.owner_name,
        phone: db.phone || '',
        category: db.category || '',
        stallNumber: db.stall_number || 0,
        status: db.status as Shop['status'],
        contractStart: db.contract_start || '',
        contractEnd: db.contract_end || '',
        monthlyRent: db.monthly_rent || 0,
        imageUrl: db.image_url || undefined,
        depositAmount: db.deposit_amount || undefined,
        depositPaidDate: db.deposit_paid_date || undefined,
        depositSlipUrl: db.deposit_slip_url || undefined,
        advanceRentMonths: db.advance_rent_months || undefined,
        nextRentDueDate: db.next_rent_due_date || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

function shopToDbShop(shop: Partial<Shop>): Partial<DbShop> {
    const result: Record<string, unknown> = {};
    if (shop.name !== undefined) result.name = shop.name;
    if (shop.ownerName !== undefined) result.owner_name = shop.ownerName;
    if (shop.phone !== undefined) result.phone = shop.phone;
    if (shop.category !== undefined) result.category = shop.category;
    if (shop.stallNumber !== undefined) result.stall_number = shop.stallNumber;
    if (shop.status !== undefined) result.status = shop.status;
    if (shop.contractStart !== undefined) result.contract_start = shop.contractStart;
    if (shop.contractEnd !== undefined) result.contract_end = shop.contractEnd;
    if (shop.monthlyRent !== undefined) result.monthly_rent = shop.monthlyRent;
    if (shop.imageUrl !== undefined) result.image_url = shop.imageUrl;
    if (shop.depositAmount !== undefined) result.deposit_amount = shop.depositAmount;
    if (shop.depositPaidDate !== undefined) result.deposit_paid_date = shop.depositPaidDate;
    if (shop.depositSlipUrl !== undefined) result.deposit_slip_url = shop.depositSlipUrl;
    if (shop.advanceRentMonths !== undefined) result.advance_rent_months = shop.advanceRentMonths;
    if (shop.nextRentDueDate !== undefined) result.next_rent_due_date = shop.nextRentDueDate;
    return result as Partial<DbShop>;
}

function dbUserToUser(db: DbUser): User {
    return {
        id: db.id,
        username: db.username,
        password: db.password,
        role: db.role as User['role'],
        shopId: db.shop_id || undefined,
        name: db.name || '',
        createdAt: db.created_at
    };
}

function dbMeterToMeter(db: DbMeterReading): MeterReading {
    return {
        id: db.id,
        shopId: db.shop_id,
        readingDate: db.reading_date,
        month: db.month,
        previousReading: db.previous_reading,
        currentReading: db.current_reading,
        unitsUsed: db.units_used,
        electricityCost: db.electricity_cost,
        waterCost: db.water_cost,
        totalCost: db.total_cost,
        status: db.status as MeterReading['status'],
        createdAt: db.created_at
    };
}

function dbPaymentToPayment(db: DbPayment): Payment {
    return {
        id: db.id,
        shopId: db.shop_id,
        meterReadingId: db.meter_reading_id || undefined,
        paymentDate: db.payment_date,
        amount: db.amount,
        type: db.type as Payment['type'],
        description: db.description || '',
        slipImageUrl: db.slip_image_url || undefined,
        slipVerifyStatus: db.slip_verify_status as Payment['slipVerifyStatus'],
        slipVerifyNote: db.slip_verify_note || undefined,
        verifiedAt: db.verified_at || undefined,
        createdAt: db.created_at
    };
}

function dbRentSlipToRentSlip(db: DbRentSlip): RentSlip {
    return {
        id: db.id,
        shopId: db.shop_id,
        month: db.month,
        amount: db.amount || 0,
        slipUrl: db.slip_url || '',
        paidDate: db.paid_date || '',
        note: db.note || undefined,
        createdAt: db.created_at
    };
}

function dbInvoiceToInvoice(db: DbInvoice): Invoice {
    return {
        id: db.id,
        invoiceNumber: db.invoice_number,
        shopId: db.shop_id,
        month: db.month,
        items: db.items as InvoiceItem[],
        totalAmount: db.total_amount,
        paidAmount: db.paid_amount,
        status: db.status as Invoice['status'],
        dueDate: db.due_date,
        sentAt: db.sent_at || undefined,
        paidAt: db.paid_at || undefined,
        notes: db.notes || undefined,
        createdAt: db.created_at,
        updatedAt: db.updated_at
    };
}

function dbInvoicePaymentToInvoicePayment(db: DbInvoicePayment): InvoicePayment {
    return {
        id: db.id,
        invoiceId: db.invoice_id,
        shopId: db.shop_id,
        amount: db.amount,
        slipImageUrl: db.slip_image_url || undefined,
        paymentDate: db.payment_date,
        status: db.status as InvoicePayment['status'],
        verifiedBy: db.verified_by || undefined,
        verifiedAt: db.verified_at || undefined,
        verifyNote: db.verify_note || undefined,
        createdAt: db.created_at
    };
}

// ==================== Users ====================
let currentUser: User | null = null;

export async function getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return (data || []).map(dbUserToUser);
}

export async function getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return dbUserToUser(data);
}

export async function addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const dbData = {
        username: user.username,
        password: user.password,
        role: user.role,
        shop_id: user.shopId || null,
        name: user.name
    };

    const { data, error } = await supabase
        .from('users')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding user:', error);
        throw error;
    }
    return dbUserToUser(data);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const dbData: Record<string, unknown> = {};
    if (updates.username !== undefined) dbData.username = updates.username;
    if (updates.password !== undefined) dbData.password = updates.password;
    if (updates.role !== undefined) dbData.role = updates.role;
    if (updates.shopId !== undefined) dbData.shop_id = updates.shopId || null;
    if (updates.name !== undefined) dbData.name = updates.name;

    const { data, error } = await supabase
        .from('users')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        return null;
    }
    return dbUserToUser(data);
}

export async function deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting user:', error);
        return false;
    }
    return true;
}

export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('lanjai_current_user');
    if (stored) {
        currentUser = JSON.parse(stored);
    }
    return currentUser;
}

export function setCurrentUser(user: User | null): void {
    currentUser = user;
    if (typeof window !== 'undefined') {
        if (user) {
            localStorage.setItem('lanjai_current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('lanjai_current_user');
        }
    }
}

export async function login(username: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !data) {
        console.error('Login error:', error);
        return null;
    }

    const user = dbUserToUser(data);
    setCurrentUser(user);
    return user;
}

export function logout(): void {
    setCurrentUser(null);
}

// ==================== Shops ====================
export async function getShops(): Promise<Shop[]> {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('stall_number', { ascending: true });

    if (error) {
        console.error('Error fetching shops:', error);
        return [];
    }
    return (data || []).map(dbShopToShop);
}

export async function getShopById(id: string): Promise<Shop | undefined> {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return dbShopToShop(data);
}

export async function addShop(shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shop> {
    const dbData = shopToDbShop(shop);
    const { data, error } = await supabase
        .from('shops')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding shop:', error);
        throw error;
    }
    return dbShopToShop(data);
}

export async function updateShop(id: string, updates: Partial<Shop>): Promise<Shop | null> {
    const dbData = shopToDbShop(updates);
    const { data, error } = await supabase
        .from('shops')
        .update({ ...dbData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating shop:', error);
        return null;
    }
    return dbShopToShop(data);
}

export async function deleteShop(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting shop:', error);
        return false;
    }
    return true;
}

// ==================== Meter Readings ====================
export async function getMeterReadings(): Promise<MeterReading[]> {
    const { data, error } = await supabase
        .from('meter_readings')
        .select('*')
        .order('reading_date', { ascending: false });

    if (error) {
        console.error('Error fetching meter readings:', error);
        return [];
    }
    return (data || []).map(dbMeterToMeter);
}

export async function getMeterReadingsByShop(shopId: string): Promise<MeterReading[]> {
    const { data, error } = await supabase
        .from('meter_readings')
        .select('*')
        .eq('shop_id', shopId)
        .order('reading_date', { ascending: false });

    if (error) {
        console.error('Error fetching meter readings:', error);
        return [];
    }
    return (data || []).map(dbMeterToMeter);
}

export async function getLatestMeterReading(shopId: string): Promise<MeterReading | undefined> {
    const { data, error } = await supabase
        .from('meter_readings')
        .select('*')
        .eq('shop_id', shopId)
        .order('reading_date', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return undefined;
    return dbMeterToMeter(data);
}

export async function addMeterReading(reading: Omit<MeterReading, 'id' | 'createdAt'>): Promise<MeterReading> {
    const dbData = {
        shop_id: reading.shopId,
        reading_date: reading.readingDate,
        month: reading.month,
        previous_reading: reading.previousReading,
        current_reading: reading.currentReading,
        units_used: reading.unitsUsed,
        electricity_cost: reading.electricityCost,
        water_cost: reading.waterCost,
        total_cost: reading.totalCost,
        status: reading.status
    };

    const { data, error } = await supabase
        .from('meter_readings')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding meter reading:', error);
        throw error;
    }
    return dbMeterToMeter(data);
}

export async function updateMeterReading(id: string, updates: Partial<MeterReading>): Promise<MeterReading | null> {
    const dbData: Record<string, unknown> = {};
    if (updates.status) dbData.status = updates.status;
    if (updates.currentReading) dbData.current_reading = updates.currentReading;

    const { data, error } = await supabase
        .from('meter_readings')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating meter reading:', error);
        return null;
    }
    return dbMeterToMeter(data);
}

// ==================== Payments ====================
export async function getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }
    return (data || []).map(dbPaymentToPayment);
}

export async function getPaymentsByShop(shopId: string): Promise<Payment[]> {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('shop_id', shopId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }
    return (data || []).map(dbPaymentToPayment);
}

export async function addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const dbData = {
        shop_id: payment.shopId,
        meter_reading_id: payment.meterReadingId || null,
        payment_date: payment.paymentDate,
        amount: payment.amount,
        type: payment.type,
        description: payment.description,
        slip_image_url: payment.slipImageUrl || null,
        slip_verify_status: payment.slipVerifyStatus,
        slip_verify_note: payment.slipVerifyNote || null,
        verified_at: payment.verifiedAt || null
    };

    const { data, error } = await supabase
        .from('payments')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding payment:', error);
        throw error;
    }
    return dbPaymentToPayment(data);
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const dbData: Record<string, unknown> = {};
    if (updates.slipVerifyStatus) dbData.slip_verify_status = updates.slipVerifyStatus;
    if (updates.slipVerifyNote) dbData.slip_verify_note = updates.slipVerifyNote;
    if (updates.verifiedAt) dbData.verified_at = updates.verifiedAt;

    const { data, error } = await supabase
        .from('payments')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating payment:', error);
        return null;
    }
    return dbPaymentToPayment(data);
}

// ==================== Rent Slips ====================
export async function getRentSlipsByShop(shopId: string): Promise<RentSlip[]> {
    const { data, error } = await supabase
        .from('rent_slips')
        .select('*')
        .eq('shop_id', shopId)
        .order('month', { ascending: false });

    if (error) {
        console.error('Error fetching rent slips:', error);
        return [];
    }
    return (data || []).map(dbRentSlipToRentSlip);
}

export async function addRentSlip(slip: Omit<RentSlip, 'id' | 'createdAt'>): Promise<RentSlip> {
    const dbData = {
        shop_id: slip.shopId,
        month: slip.month,
        amount: slip.amount,
        slip_url: slip.slipUrl,
        paid_date: slip.paidDate,
        note: slip.note || null
    };

    const { data, error } = await supabase
        .from('rent_slips')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding rent slip:', error);
        throw error;
    }
    return dbRentSlipToRentSlip(data);
}

// ==================== Invoices ====================
export async function getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
    return (data || []).map(dbInvoiceToInvoice);
}

export async function getInvoicesByShop(shopId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
    return (data || []).map(dbInvoiceToInvoice);
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return dbInvoiceToInvoice(data);
}

export async function getPendingInvoicesForShop(shopId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shopId)
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching pending invoices:', error);
        return [];
    }
    return (data || []).map(dbInvoiceToInvoice);
}

export async function generateInvoiceNumber(month: string): Promise<string> {
    const { data } = await supabase
        .from('invoices')
        .select('id')
        .eq('month', month);

    const seq = ((data?.length || 0) + 1).toString().padStart(3, '0');
    return `INV-${month.replace('-', '')}-${seq}`;
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoiceNumber = await generateInvoiceNumber(invoice.month);
    const dbData = {
        invoice_number: invoiceNumber,
        shop_id: invoice.shopId,
        month: invoice.month,
        items: invoice.items,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount,
        status: invoice.status,
        due_date: invoice.dueDate,
        notes: invoice.notes || null
    };

    const { data, error } = await supabase
        .from('invoices')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding invoice:', error);
        throw error;
    }
    return dbInvoiceToInvoice(data);
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const dbData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status) dbData.status = updates.status;
    if (updates.paidAmount !== undefined) dbData.paid_amount = updates.paidAmount;
    if (updates.sentAt) dbData.sent_at = updates.sentAt;
    if (updates.paidAt) dbData.paid_at = updates.paidAt;

    const { data, error } = await supabase
        .from('invoices')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating invoice:', error);
        return null;
    }
    return dbInvoiceToInvoice(data);
}

export async function deleteInvoice(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting invoice:', error);
        return false;
    }
    return true;
}

export async function sendInvoice(id: string): Promise<Invoice | null> {
    return updateInvoice(id, {
        status: 'sent',
        sentAt: new Date().toISOString()
    });
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice | null> {
    const invoice = await getInvoiceById(id);
    return updateInvoice(id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidAmount: invoice?.totalAmount || 0
    });
}

// ==================== Statistics ====================
export async function getStatistics() {
    const shops = await getShops();
    const payments = await getPayments();
    const meters = await getMeterReadings();
    const invoices = await getInvoices();

    const activeShops = shops.filter(s => s.status === 'active').length;
    const totalRent = shops.reduce((sum, s) => sum + s.monthlyRent, 0);
    const totalPaid = payments.filter(p => p.slipVerifyStatus === 'verified').reduce((sum, p) => sum + p.amount, 0);
    const pendingSlips = payments.filter(p => p.slipVerifyStatus === 'pending').length;
    const unpaidMeters = meters.filter(m => m.status === 'pending').length;
    const pendingInvoices = invoices.filter(i => i.status === 'sent').length;

    return {
        totalShops: shops.length,
        activeShops,
        totalRent,
        totalPaid,
        pendingSlips,
        unpaidMeters,
        pendingInvoices
    };
}

// ==================== Monthly Invoice Generation ====================
export async function createMonthlyInvoices(month: string): Promise<Invoice[]> {
    const shops = (await getShops()).filter(s => s.status === 'active');
    const meters = (await getMeterReadings()).filter(m => m.month === month);
    const existingInvoices = (await getInvoices()).filter(i => i.month === month);
    const existingShopIds = existingInvoices.map(i => i.shopId);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const newInvoices: Invoice[] = [];

    for (const shop of shops) {
        if (existingShopIds.includes(shop.id)) continue;

        const items: InvoiceItem[] = [];

        items.push({
            type: 'rent',
            description: `ค่าเช่าประจำเดือน ${month}`,
            amount: shop.monthlyRent
        });

        const meterReading = meters.find(m => m.shopId === shop.id);
        if (meterReading) {
            items.push({
                type: 'electricity',
                description: `ค่าไฟฟ้า ${meterReading.unitsUsed} หน่วย x ${ELECTRICITY_RATE} บาท`,
                amount: meterReading.electricityCost,
                meterReadingId: meterReading.id
            });
            items.push({
                type: 'water',
                description: 'ค่าน้ำประปารายเดือน',
                amount: meterReading.waterCost,
                meterReadingId: meterReading.id
            });
        } else {
            items.push({
                type: 'water',
                description: 'ค่าน้ำประปารายเดือน',
                amount: WATER_FLAT_RATE
            });
        }

        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        const invoice = await addInvoice({
            shopId: shop.id,
            month,
            items,
            totalAmount,
            paidAmount: 0,
            status: 'draft',
            dueDate: dueDate.toISOString()
        });

        newInvoices.push(invoice);
    }

    return newInvoices;
}

export async function sendAllDraftInvoices(month: string): Promise<number> {
    const invoices = (await getInvoices()).filter(i => i.month === month && i.status === 'draft');
    let count = 0;
    for (const invoice of invoices) {
        if (await sendInvoice(invoice.id)) count++;
    }
    return count;
}

// ==================== Invoice Payments ====================
export async function addInvoicePayment(payment: Omit<InvoicePayment, 'id' | 'createdAt'>): Promise<InvoicePayment> {
    const dbData = {
        invoice_id: payment.invoiceId,
        shop_id: payment.shopId,
        amount: payment.amount,
        slip_image_url: payment.slipImageUrl || null,
        payment_date: payment.paymentDate,
        status: payment.status
    };

    const { data, error } = await supabase
        .from('invoice_payments')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding invoice payment:', error);
        throw error;
    }

    // Update invoice status to pending_verification
    await updateInvoice(payment.invoiceId, {
        status: 'pending_verification'
    });

    return dbInvoicePaymentToInvoicePayment(data);
}

export async function getInvoicePaymentsByInvoice(invoiceId: string): Promise<InvoicePayment[]> {
    const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invoice payments:', error);
        return [];
    }
    return (data || []).map(dbInvoicePaymentToInvoicePayment);
}

export async function getInvoicePaymentsByShop(shopId: string): Promise<InvoicePayment[]> {
    const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invoice payments:', error);
        return [];
    }
    return (data || []).map(dbInvoicePaymentToInvoicePayment);
}

export async function getPendingInvoicePayments(): Promise<InvoicePayment[]> {
    const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending invoice payments:', error);
        return [];
    }
    return (data || []).map(dbInvoicePaymentToInvoicePayment);
}

export async function verifyInvoicePayment(
    id: string,
    status: 'verified' | 'rejected',
    verifiedBy: string,
    verifyNote?: string
): Promise<InvoicePayment | null> {
    const dbData = {
        status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        verify_note: verifyNote || null
    };

    const { data, error } = await supabase
        .from('invoice_payments')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error verifying invoice payment:', error);
        return null;
    }

    const payment = dbInvoicePaymentToInvoicePayment(data);

    // Update invoice status based on verification result
    if (status === 'verified') {
        const invoice = await getInvoiceById(payment.invoiceId);
        if (invoice) {
            await updateInvoice(payment.invoiceId, {
                status: 'paid',
                paidAt: new Date().toISOString(),
                paidAmount: invoice.totalAmount
            });
        }
    } else {
        await updateInvoice(payment.invoiceId, {
            status: 'payment_rejected'
        });
    }

    return payment;
}

// Get invoices that are waiting for verification (admin view)
export async function getInvoicesPendingVerification(): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching invoices pending verification:', error);
        return [];
    }
    return (data || []).map(dbInvoiceToInvoice);
}

// ==================== Contract Functions ====================
function dbContractToContract(db: DbContract): Contract {
    return {
        id: db.id,
        shopId: db.shop_id,
        contractNumber: db.contract_number,
        startDate: db.start_date,
        endDate: db.end_date,
        monthlyRent: db.monthly_rent,
        depositAmount: db.deposit_amount,
        terms: db.terms || undefined,
        status: db.status as ContractStatus,
        landlordSignatureUrl: db.landlord_signature_url || undefined,
        tenantSignatureUrl: db.tenant_signature_url || undefined,
        signedAt: db.signed_at || undefined,
        createdAt: db.created_at
    };
}

function generateContractNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CTR-${year}${month}-${random}`;
}

export async function getContracts(): Promise<Contract[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contracts:', error);
        return [];
    }
    return (data || []).map(dbContractToContract);
}

export async function getContractById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching contract:', error);
        return null;
    }
    return dbContractToContract(data);
}

export async function getContractsByShop(shopId: string): Promise<Contract[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contracts:', error);
        return [];
    }
    return (data || []).map(dbContractToContract);
}

export async function addContract(contract: Omit<Contract, 'id' | 'contractNumber' | 'createdAt'>): Promise<Contract> {
    const dbData = {
        shop_id: contract.shopId,
        contract_number: generateContractNumber(),
        start_date: contract.startDate,
        end_date: contract.endDate,
        monthly_rent: contract.monthlyRent,
        deposit_amount: contract.depositAmount,
        terms: contract.terms || null,
        status: contract.status
    };

    const { data, error } = await supabase
        .from('contracts')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('Error adding contract:', error);
        throw error;
    }
    return dbContractToContract(data);
}

export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
    const dbUpdates: Partial<DbContract> = {};

    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.monthlyRent !== undefined) dbUpdates.monthly_rent = updates.monthlyRent;
    if (updates.depositAmount !== undefined) dbUpdates.deposit_amount = updates.depositAmount;
    if (updates.terms !== undefined) dbUpdates.terms = updates.terms || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.landlordSignatureUrl !== undefined) dbUpdates.landlord_signature_url = updates.landlordSignatureUrl || null;
    if (updates.tenantSignatureUrl !== undefined) dbUpdates.tenant_signature_url = updates.tenantSignatureUrl || null;
    if (updates.signedAt !== undefined) dbUpdates.signed_at = updates.signedAt || null;

    const { data, error } = await supabase
        .from('contracts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating contract:', error);
        return null;
    }
    return dbContractToContract(data);
}

export async function signContract(id: string, tenantSignatureUrl: string): Promise<Contract | null> {
    return updateContract(id, {
        tenantSignatureUrl,
        status: 'signed',
        signedAt: new Date().toISOString()
    });
}

export async function sendContractForSignature(id: string, landlordSignatureUrl?: string): Promise<Contract | null> {
    return updateContract(id, {
        landlordSignatureUrl,
        status: 'pending_signature'
    });
}

export async function getActiveContractByShop(shopId: string): Promise<Contract | null> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'signed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        console.error('Error fetching active contract:', error);
        return null;
    }
    return dbContractToContract(data);
}
