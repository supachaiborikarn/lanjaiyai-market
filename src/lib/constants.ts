// ==================== App Constants ====================

// Business Constants
export const ELECTRICITY_RATE = 5; // บาท/หน่วย
export const WATER_FLAT_RATE = 150; // บาท/เดือน
export const CONTRACT_EXPIRY_WARNING_DAYS = 60; // วันก่อนหมดสัญญาที่จะแจ้งเตือน
export const CONTRACT_EXPIRY_CRITICAL_DAYS = 30; // วันก่อนหมดสัญญาที่ถือว่าเร่งด่วน

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PENDING_ITEMS_DISPLAY = 5;

// Date Formats
export const THAI_LOCALE = 'th-TH';
export const MONTH_FORMAT = 'YYYY-MM';

// Storage Keys (for localStorage)
export const STORAGE_KEYS = {
    CURRENT_USER: 'lanjai_current_user',
    USERS: 'lanjai_users',
    SHOPS: 'lanjai_shops',
    METERS: 'lanjai_meters',
    PAYMENTS: 'lanjai_payments',
    INVOICES: 'lanjai_invoices'
} as const;

// API Endpoints
export const API_ROUTES = {
    UPLOAD: '/api/upload'
} as const;

// Admin Routes
export const ADMIN_ROUTES = {
    DASHBOARD: '/admin/dashboard',
    SHOPS: '/admin/shops',
    USERS: '/admin/users',
    CONTRACTS: '/admin/contracts',
    METERS: '/admin/meters',
    INVOICES: '/admin/invoices',
    PAYMENTS: '/admin/payments',
    REPORTS: '/admin/reports'
} as const;

// Shop Routes
export const SHOP_ROUTES = {
    DASHBOARD: '/shop/dashboard',
    CONTRACTS: '/shop/contracts',
    INVOICES: '/shop/invoices',
    PAYMENTS: '/shop/payments'
} as const;

// UI Constants
export const ANIMATION_DURATION = 300; // ms
export const TOAST_DURATION = 3000; // ms
export const DEBOUNCE_DELAY = 300; // ms

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Thai Month Names
export const THAI_MONTH_NAMES = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];
