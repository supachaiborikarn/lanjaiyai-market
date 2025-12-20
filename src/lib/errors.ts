// ==================== Error Handling Utilities ====================

import { showToast } from '@/components/ui/Toast';

// Error messages in Thai
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
    UNAUTHORIZED: 'กรุณาเข้าสู่ระบบใหม่',
    NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
    VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    FILE_TOO_LARGE: 'ไฟล์มีขนาดใหญ่เกินไป',
    INVALID_FILE_TYPE: 'ประเภทไฟล์ไม่ถูกต้อง',
    UNKNOWN_ERROR: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',

    // Specific operations
    SAVE_FAILED: 'ไม่สามารถบันทึกข้อมูลได้',
    DELETE_FAILED: 'ไม่สามารถลบข้อมูลได้',
    LOAD_FAILED: 'ไม่สามารถโหลดข้อมูลได้',
    UPLOAD_FAILED: 'ไม่สามารถอัพโหลดไฟล์ได้',

    // Invoice specific
    INVOICE_CREATE_FAILED: 'ไม่สามารถสร้างใบวางบิลได้',
    INVOICE_SEND_FAILED: 'ไม่สามารถส่งใบวางบิลได้',
    PAYMENT_FAILED: 'ไม่สามารถบันทึกการชำระเงินได้',
    VERIFY_FAILED: 'ไม่สามารถตรวจสอบสลิปได้'
} as const;

// Success messages in Thai
export const SUCCESS_MESSAGES = {
    SAVE_SUCCESS: 'บันทึกข้อมูลเรียบร้อย',
    DELETE_SUCCESS: 'ลบข้อมูลเรียบร้อย',
    UPLOAD_SUCCESS: 'อัพโหลดไฟล์เรียบร้อย',
    SEND_SUCCESS: 'ส่งข้อมูลเรียบร้อย',
    VERIFY_SUCCESS: 'ตรวจสอบเรียบร้อย',

    // Invoice specific
    INVOICE_CREATED: 'สร้างใบวางบิลเรียบร้อย',
    INVOICE_SENT: 'ส่งใบวางบิลเรียบร้อย',
    PAYMENT_SUCCESS: 'บันทึกการชำระเงินเรียบร้อย',
    INVOICE_EDITED: 'แก้ไขใบวางบิลเรียบร้อย',
    INVOICE_DELETED: 'ลบใบวางบิลเรียบร้อย'
} as const;

// Type for error with optional details
export interface AppError {
    message: string;
    code?: string;
    details?: unknown;
}

/**
 * Handle error and show toast notification
 */
export function handleError(error: unknown, fallbackMessage?: string): void {
    console.error('Error:', error);

    let message = fallbackMessage || ERROR_MESSAGES.UNKNOWN_ERROR;

    if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
            message = ERROR_MESSAGES.UNAUTHORIZED;
        } else if (error.message.includes('404') || error.message.includes('not found')) {
            message = ERROR_MESSAGES.NOT_FOUND;
        }
    }

    showToast(message, 'error');
}

/**
 * Show success notification
 */
export function showSuccess(message: string): void {
    showToast(message, 'success');
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage?: string
): Promise<T | null> {
    try {
        return await operation();
    } catch (error) {
        handleError(error, errorMessage);
        return null;
    }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}
