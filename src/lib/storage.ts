import { User, Shop, MeterReading, Payment, Invoice, InvoiceItem, ELECTRICITY_RATE, WATER_FLAT_RATE } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
    USERS: 'lanjai_users',
    SHOPS: 'lanjai_shops',
    METERS: 'lanjai_meters',
    PAYMENTS: 'lanjai_payments',
    INVOICES: 'lanjai_invoices',
    CURRENT_USER: 'lanjai_current_user'
};

// Helper to check if localStorage is available
const isClient = typeof window !== 'undefined';

// ==================== Users ====================
export function getUsers(): User[] {
    if (!isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
        // Initialize with default users
        const defaultUsers = getDefaultUsers();
        saveUsers(defaultUsers);
        return defaultUsers;
    }
    return JSON.parse(data);
}

export function saveUsers(users: User[]): void {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
    if (!isClient) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User | null): void {
    if (!isClient) return;
    if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
}

export function login(username: string, password: string): User | null {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        setCurrentUser(user);
        return user;
    }
    return null;
}

export function logout(): void {
    setCurrentUser(null);
}

// ==================== Shops ====================
export function getShops(): Shop[] {
    if (!isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.SHOPS);
    if (!data) {
        const defaultShops = getDefaultShops();
        saveShops(defaultShops);
        return defaultShops;
    }
    return JSON.parse(data);
}

export function saveShops(shops: Shop[]): void {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
}

export function getShopById(id: string): Shop | undefined {
    return getShops().find(s => s.id === id);
}

export function addShop(shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Shop {
    const shops = getShops();
    const newShop: Shop = {
        ...shop,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    shops.push(newShop);
    saveShops(shops);
    return newShop;
}

export function updateShop(id: string, updates: Partial<Shop>): Shop | null {
    const shops = getShops();
    const index = shops.findIndex(s => s.id === id);
    if (index === -1) return null;
    shops[index] = { ...shops[index], ...updates, updatedAt: new Date().toISOString() };
    saveShops(shops);
    return shops[index];
}

export function deleteShop(id: string): boolean {
    const shops = getShops();
    const filtered = shops.filter(s => s.id !== id);
    if (filtered.length === shops.length) return false;
    saveShops(filtered);
    return true;
}

// ==================== Meter Readings ====================
export function getMeterReadings(): MeterReading[] {
    if (!isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.METERS);
    return data ? JSON.parse(data) : [];
}

export function saveMeterReadings(readings: MeterReading[]): void {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify(readings));
}

export function getMeterReadingsByShop(shopId: string): MeterReading[] {
    return getMeterReadings().filter(m => m.shopId === shopId);
}

export function getLatestMeterReading(shopId: string): MeterReading | undefined {
    const readings = getMeterReadingsByShop(shopId);
    return readings.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())[0];
}

export function addMeterReading(reading: Omit<MeterReading, 'id' | 'createdAt'>): MeterReading {
    const readings = getMeterReadings();
    const newReading: MeterReading = {
        ...reading,
        id: uuidv4(),
        createdAt: new Date().toISOString()
    };
    readings.push(newReading);
    saveMeterReadings(readings);
    return newReading;
}

export function updateMeterReading(id: string, updates: Partial<MeterReading>): MeterReading | null {
    const readings = getMeterReadings();
    const index = readings.findIndex(r => r.id === id);
    if (index === -1) return null;
    readings[index] = { ...readings[index], ...updates };
    saveMeterReadings(readings);
    return readings[index];
}

// ==================== Payments ====================
export function getPayments(): Payment[] {
    if (!isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return data ? JSON.parse(data) : [];
}

export function savePayments(payments: Payment[]): void {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
}

export function getPaymentsByShop(shopId: string): Payment[] {
    return getPayments().filter(p => p.shopId === shopId);
}

export function addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const payments = getPayments();
    const newPayment: Payment = {
        ...payment,
        id: uuidv4(),
        createdAt: new Date().toISOString()
    };
    payments.push(newPayment);
    savePayments(payments);
    return newPayment;
}

export function updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    const payments = getPayments();
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;
    payments[index] = { ...payments[index], ...updates };
    savePayments(payments);
    return payments[index];
}

// ==================== Default Data ====================
function getDefaultUsers(): User[] {
    const shops = getDefaultShops();
    const users: User[] = [
        {
            id: 'admin-1',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'ผู้ดูแลระบบ',
            createdAt: new Date().toISOString()
        }
    ];

    // Create shop owner accounts
    shops.forEach((shop, index) => {
        users.push({
            id: `shop-owner-${index + 1}`,
            username: `shop${index + 1}`,
            password: 'shop123',
            role: 'shop_owner',
            shopId: shop.id,
            name: shop.ownerName,
            createdAt: new Date().toISOString()
        });
    });

    return users;
}

function getDefaultShops(): Shop[] {
    const now = new Date();
    const contractStart = new Date(now.getFullYear(), 0, 1).toISOString();
    const contractEnd = new Date(now.getFullYear() + 1, 0, 1).toISOString();

    const shops: Shop[] = [
        { id: 'shop-1', name: 'ร้านก๋วยเตี๋ยวลุงแดง', ownerName: 'แดง สุขใจ', phone: '081-234-5678', category: 'อาหาร', stallNumber: 1, status: 'active', contractStart, contractEnd, monthlyRent: 3000, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-2', name: 'ร้านข้าวแกงป้าสมศรี', ownerName: 'สมศรี รักดี', phone: '082-345-6789', category: 'อาหาร', stallNumber: 2, status: 'active', contractStart, contractEnd, monthlyRent: 3000, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-3', name: 'ร้านผักสดนายตี๋', ownerName: 'ตี๋ มีสุข', phone: '083-456-7890', category: 'ผักผลไม้', stallNumber: 3, status: 'active', contractStart, contractEnd, monthlyRent: 2500, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-4', name: 'ร้านหมูสดนายเสือ', ownerName: 'เสือ ใจกล้า', phone: '084-567-8901', category: 'เนื้อสัตว์', stallNumber: 4, status: 'active', contractStart, contractEnd, monthlyRent: 3500, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-5', name: 'ร้านเสื้อผ้าแฟชั่น', ownerName: 'นิด แต่งตัวดี', phone: '085-678-9012', category: 'เสื้อผ้า', stallNumber: 5, status: 'active', contractStart, contractEnd, monthlyRent: 4000, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-6', name: 'ร้านของชำลุงหมู', ownerName: 'หมู มากเงิน', phone: '086-789-0123', category: 'ของชำ', stallNumber: 6, status: 'active', contractStart, contractEnd, monthlyRent: 2800, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-7', name: 'ร้านน้ำผลไม้สด', ownerName: 'จอย สดใส', phone: '087-890-1234', category: 'เครื่องดื่ม', stallNumber: 7, status: 'active', contractStart, contractEnd, monthlyRent: 2500, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-8', name: 'ร้านขนมหวานไทย', ownerName: 'หวาน นิ่มนวล', phone: '088-901-2345', category: 'ขนม', stallNumber: 8, status: 'active', contractStart, contractEnd, monthlyRent: 2500, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-9', name: 'ร้านอาหารทะเล', ownerName: 'ทะเล ชลธาร', phone: '089-012-3456', category: 'อาหารทะเล', stallNumber: 9, status: 'active', contractStart, contractEnd, monthlyRent: 4000, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'shop-10', name: 'ร้านของใช้ในบ้าน', ownerName: 'บ้าน สุขสันต์', phone: '090-123-4567', category: 'ของใช้', stallNumber: 10, status: 'inactive', contractStart, contractEnd, monthlyRent: 3000, createdAt: now.toISOString(), updatedAt: now.toISOString() }
    ];

    return shops;
}

// ==================== Statistics ====================
export function getStatistics() {
    const shops = getShops();
    const payments = getPayments();
    const meters = getMeterReadings();
    const invoices = getInvoices();

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

// ==================== Invoices ====================
export function getInvoices(): Invoice[] {
    if (!isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
}

export function saveInvoices(invoices: Invoice[]): void {
    if (!isClient) return;
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}

export function getInvoicesByShop(shopId: string): Invoice[] {
    return getInvoices().filter(i => i.shopId === shopId);
}

export function getInvoiceById(id: string): Invoice | undefined {
    return getInvoices().find(i => i.id === id);
}

export function getPendingInvoicesForShop(shopId: string): Invoice[] {
    return getInvoices().filter(i =>
        i.shopId === shopId &&
        (i.status === 'sent' || i.status === 'overdue')
    );
}

export function generateInvoiceNumber(month: string): string {
    const invoices = getInvoices();
    const monthInvoices = invoices.filter(i => i.month === month);
    const seq = (monthInvoices.length + 1).toString().padStart(3, '0');
    return `INV-${month.replace('-', '')}-${seq}`;
}

export function addInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Invoice {
    const invoices = getInvoices();
    const newInvoice: Invoice = {
        ...invoice,
        id: uuidv4(),
        invoiceNumber: generateInvoiceNumber(invoice.month),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    invoices.push(newInvoice);
    saveInvoices(invoices);
    return newInvoice;
}

export function updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = getInvoices();
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;
    invoices[index] = { ...invoices[index], ...updates, updatedAt: new Date().toISOString() };
    saveInvoices(invoices);
    return invoices[index];
}

export function deleteInvoice(id: string): boolean {
    const invoices = getInvoices();
    const filtered = invoices.filter(i => i.id !== id);
    if (filtered.length === invoices.length) return false;
    saveInvoices(filtered);
    return true;
}

export function sendInvoice(id: string): Invoice | null {
    return updateInvoice(id, {
        status: 'sent',
        sentAt: new Date().toISOString()
    });
}

export function markInvoiceAsPaid(id: string, paymentId?: string): Invoice | null {
    return updateInvoice(id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidAmount: getInvoiceById(id)?.totalAmount || 0
    });
}

export function createMonthlyInvoices(month: string): Invoice[] {
    const shops = getShops().filter(s => s.status === 'active');
    const meters = getMeterReadings().filter(m => m.month === month);
    const existingInvoices = getInvoices().filter(i => i.month === month);
    const existingShopIds = existingInvoices.map(i => i.shopId);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // กำหนดชำระ 15 วัน

    const newInvoices: Invoice[] = [];

    for (const shop of shops) {
        // ข้ามถ้ามีใบบิลแล้ว
        if (existingShopIds.includes(shop.id)) continue;

        const items: InvoiceItem[] = [];

        // ค่าเช่า
        items.push({
            type: 'rent',
            description: `ค่าเช่าประจำเดือน ${month}`,
            amount: shop.monthlyRent
        });

        // ค่าน้ำไฟจากมิเตอร์
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
            // ถ้ายังไม่จดมิเตอร์ ใช้ค่า flat rate
            items.push({
                type: 'water',
                description: 'ค่าน้ำประปารายเดือน',
                amount: WATER_FLAT_RATE
            });
        }

        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        const invoice = addInvoice({
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

export function sendAllDraftInvoices(month: string): number {
    const invoices = getInvoices().filter(i => i.month === month && i.status === 'draft');
    let count = 0;
    for (const invoice of invoices) {
        if (sendInvoice(invoice.id)) count++;
    }
    return count;
}
