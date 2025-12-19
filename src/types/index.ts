// Types for ลานใจใหญ่ Market Management System

export type UserRole = 'admin' | 'shop_owner';
export type ShopStatus = 'active' | 'inactive' | 'suspended';
export type PaymentType = 'rent' | 'utilities' | 'other';
export type SlipVerifyStatus = 'pending' | 'verified' | 'rejected';
export type MeterStatus = 'pending' | 'paid';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  shopId?: string;
  name: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  category: string;
  stallNumber: number;
  status: ShopStatus;
  contractStart: string;
  contractEnd: string;
  monthlyRent: number;
  imageUrl?: string;
  // ข้อมูลมัดจำ
  depositAmount?: number;
  depositPaidDate?: string;
  depositSlipUrl?: string;
  // ข้อมูลค่าเช่าล่วงหน้า
  advanceRentMonths?: number;
  nextRentDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// สลิปค่าเช่า
export interface RentSlip {
  id: string;
  shopId: string;
  month: string;
  amount: number;
  slipUrl: string;
  paidDate: string;
  note?: string;
  createdAt: string;
}


export interface MeterReading {
  id: string;
  shopId: string;
  readingDate: string;
  month: string; // YYYY-MM format
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  electricityCost: number;
  waterCost: number;
  totalCost: number;
  status: MeterStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  shopId: string;
  meterReadingId?: string;
  paymentDate: string;
  amount: number;
  type: PaymentType;
  description: string;
  slipImageUrl?: string;
  slipVerifyStatus: SlipVerifyStatus;
  slipVerifyNote?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface SlipAnalysisResult {
  isValid: boolean;
  confidence: number;
  extractedAmount?: number;
  extractedDate?: string;
  extractedTime?: string;
  bankName?: string;
  issues: string[];
  suggestions: string[];
}

// Constants
export const ELECTRICITY_RATE = 5; // 5 บาท/หน่วย
export const WATER_FLAT_RATE = 150; // 150 บาท/เดือน

export const SHOP_CATEGORIES = [
  'อาหาร',
  'เสื้อผ้า',
  'ของใช้',
  'ผักผลไม้',
  'เครื่องดื่ม',
  'ขนม',
  'เนื้อสัตว์',
  'อาหารทะเล',
  'ของชำ',
  'อื่นๆ'
];

export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  active: 'เปิดใช้งาน',
  inactive: 'ปิดชั่วคราว',
  suspended: 'ยกเลิก'
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  rent: 'ค่าเช่า',
  utilities: 'ค่าสาธารณูปโภค',
  other: 'อื่นๆ'
};

export const SLIP_STATUS_LABELS: Record<SlipVerifyStatus, string> = {
  pending: 'รอตรวจสอบ',
  verified: 'ผ่านการตรวจสอบ',
  rejected: 'ไม่ผ่าน'
};

// ==================== Invoice Types ====================
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceItemType = 'rent' | 'electricity' | 'water' | 'other';

export interface InvoiceItem {
  type: InvoiceItemType;
  description: string;
  amount: number;
  meterReadingId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  shopId: string;
  month: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  sentAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'ฉบับร่าง',
  sent: 'ส่งแล้ว',
  paid: 'ชำระแล้ว',
  overdue: 'เกินกำหนด',
  cancelled: 'ยกเลิก'
};

export const INVOICE_ITEM_TYPE_LABELS: Record<InvoiceItemType, string> = {
  rent: 'ค่าเช่า',
  electricity: 'ค่าไฟฟ้า',
  water: 'ค่าน้ำ',
  other: 'อื่นๆ'
};
