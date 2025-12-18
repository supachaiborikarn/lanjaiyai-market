import { SlipAnalysisResult } from '@/types';

// AI Slip Verification Service
// This is a simulation that analyzes slip images for validity

interface SlipPatterns {
    bankPatterns: RegExp[];
    amountPatterns: RegExp[];
    datePatterns: RegExp[];
    timePatterns: RegExp[];
}

const SLIP_PATTERNS: SlipPatterns = {
    bankPatterns: [
        /กสิกรไทย|KBANK/i,
        /กรุงไทย|KTB/i,
        /ไทยพาณิชย์|SCB/i,
        /กรุงเทพ|BBL/i,
        /ทหารไทยธนชาต|TTB/i,
        /ออมสิน|GSB/i,
        /กรุงศรี|BAY/i,
        /PromptPay|พร้อมเพย์/i
    ],
    amountPatterns: [
        /(?:THB|฿|บาท)\s*[\d,]+\.?\d*/i,
        /[\d,]+\.?\d*\s*(?:THB|฿|บาท)/i,
        /จำนวนเงิน[:\s]*[\d,]+\.?\d*/i,
        /Amount[:\s]*[\d,]+\.?\d*/i
    ],
    datePatterns: [
        /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,
        /\d{1,2}\s+(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s+\d{2,4}/i
    ],
    timePatterns: [
        /\d{1,2}:\d{2}(:\d{2})?(\s*(?:AM|PM|น\.))?/i
    ]
};

export async function analyzeSlip(imageFile: File): Promise<SlipAnalysisResult> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 0;

    // Check file type
    if (!imageFile.type.startsWith('image/')) {
        return {
            isValid: false,
            confidence: 0,
            issues: ['ไฟล์ที่อัพโหลดไม่ใช่รูปภาพ'],
            suggestions: ['กรุณาอัพโหลดไฟล์รูปภาพ (JPG, PNG)']
        };
    }

    // Check file size (should be reasonable for a slip)
    const fileSizeKB = imageFile.size / 1024;
    if (fileSizeKB < 10) {
        issues.push('ไฟล์มีขนาดเล็กเกินไป อาจไม่ชัดเจน');
        suggestions.push('กรุณาถ่ายรูปใหม่ให้ชัดเจนขึ้น');
    } else if (fileSizeKB > 10000) {
        issues.push('ไฟล์มีขนาดใหญ่เกินไป');
        suggestions.push('กรุณาลดขนาดไฟล์');
    } else {
        confidence += 20;
    }

    // Check image dimensions (simulation based on file size)
    if (fileSizeKB >= 50 && fileSizeKB <= 5000) {
        confidence += 25;
    }

    // Simulate content analysis based on file name and type
    const fileName = imageFile.name.toLowerCase();
    if (fileName.includes('slip') || fileName.includes('receipt') || fileName.includes('payment')) {
        confidence += 15;
    }

    // Simulate bank detection
    const simulatedBanks = ['กสิกรไทย', 'กรุงไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'พร้อมเพย์'];
    const detectedBank = simulatedBanks[Math.floor(Math.random() * simulatedBanks.length)];
    confidence += 20;

    // Simulate amount extraction (random amount for demo)
    const simulatedAmount = Math.floor(Math.random() * 5000) + 500;
    confidence += 10;

    // Simulate date/time extraction
    const now = new Date();
    const simulatedDate = now.toLocaleDateString('th-TH');
    const simulatedTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    confidence += 10;

    // Add random verification factors
    if (Math.random() > 0.3) {
        confidence = Math.min(confidence + 10, 95);
    }

    // Determine validity
    const isValid = confidence >= 60;

    if (!isValid) {
        issues.push('ไม่สามารถยืนยันสลิปได้อย่างชัดเจน');
        suggestions.push('กรุณาตรวจสอบว่าสลิปถ่ายครบถ้วนและชัดเจน');
    }

    return {
        isValid,
        confidence,
        extractedAmount: simulatedAmount,
        extractedDate: simulatedDate,
        extractedTime: simulatedTime,
        bankName: detectedBank,
        issues,
        suggestions
    };
}

// Quick validation checks
export function quickValidateSlip(file: File): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP, HEIC' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: 'ไฟล์มีขนาดใหญ่เกิน 10MB' };
    }

    return { valid: true };
}

// Convert file to base64 for storage
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
