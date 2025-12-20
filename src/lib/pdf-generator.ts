import { Contract, Shop } from '@/types';
import { formatCurrency, formatDate } from './utils';

export interface ContractPDFData {
    contract: Contract;
    shop: Shop;
    landlordName?: string;
}

export function generateContractPDF(data: ContractPDFData): void {
    const { contract, shop, landlordName = 'ตลาดลานใจใหญ่' } = data;

    // Create HTML content for printing - optimized for exact 1 A4 page
    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>สัญญาเช่า ${contract.contractNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @page {
            size: A4;
            margin: 10mm;
        }
        body {
            font-family: 'Sarabun', 'Noto Sans Thai', 'TH Sarabun New', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
            background: white;
            padding: 8px;
            max-height: 277mm;
            overflow: hidden;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #1a56db;
            padding-bottom: 8px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            color: #1a56db;
        }
        .header h2 {
            font-size: 12px;
            color: #666;
        }
        .contract-number {
            text-align: center;
            font-size: 12px;
            margin-bottom: 10px;
            color: #555;
        }
        .section {
            margin-bottom: 10px;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 6px;
            padding-bottom: 3px;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
        }
        .info-item {
            padding: 6px 8px;
            background: #f3f4f6;
            border-radius: 4px;
            border-left: 3px solid #1a56db;
        }
        .info-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
        }
        .info-value {
            font-weight: 600;
            font-size: 11px;
        }
        .full-width {
            grid-column: 1 / -1;
        }
        .col-span-2 {
            grid-column: span 2;
        }
        .terms-list {
            padding-left: 18px;
            font-size: 10px;
        }
        .terms-list li {
            margin-bottom: 3px;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 15px;
            padding-top: 10px;
        }
        .signature-box {
            text-align: center;
        }
        .signature-image {
            height: 45px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            margin-bottom: 5px;
        }
        .signature-image img {
            max-height: 40px;
            max-width: 120px;
        }
        .signature-line {
            border-bottom: 1px dashed #333;
            height: 45px;
            margin-bottom: 5px;
        }
        .signature-name {
            font-weight: 600;
            font-size: 10px;
        }
        .signature-label {
            font-size: 9px;
            color: #666;
        }
        .date-line {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
            font-size: 8px;
            color: #888;
        }
        @media print {
            body { 
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>สัญญาเช่าร้านค้า</h1>
        <h2>Rental Contract Agreement</h2>
    </div>
    
    <div class="contract-number">
        <strong>เลขที่สัญญา:</strong> ${contract.contractNumber}
    </div>
    
    <div class="section">
        <div class="section-title">📋 คู่สัญญา</div>
        <div class="info-grid">
            <div class="info-item col-span-2">
                <div class="info-label">ผู้ให้เช่า</div>
                <div class="info-value">${landlordName}</div>
            </div>
            <div class="info-item col-span-2">
                <div class="info-label">ผู้เช่า</div>
                <div class="info-value">${shop.ownerName}</div>
            </div>
            <div class="info-item col-span-2">
                <div class="info-label">ชื่อร้าน</div>
                <div class="info-value">${shop.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">หมายเลขแผง</div>
                <div class="info-value">${shop.stallNumber}</div>
            </div>
            <div class="info-item">
                <div class="info-label">เบอร์โทร</div>
                <div class="info-value">${shop.phone}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">📅 รายละเอียดสัญญา</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">วันเริ่มสัญญา</div>
                <div class="info-value">${formatDate(contract.startDate)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">วันสิ้นสุด</div>
                <div class="info-value">${formatDate(contract.endDate)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ค่าเช่า/เดือน</div>
                <div class="info-value" style="color: #1a56db;">${formatCurrency(contract.monthlyRent)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ค่ามัดจำ</div>
                <div class="info-value">${formatCurrency(contract.depositAmount)}</div>
            </div>
        </div>
    </div>
    
    ${contract.terms ? `
    <div class="section">
        <div class="section-title">📝 เงื่อนไขพิเศษ</div>
        <div class="info-item full-width">
            ${contract.terms}
        </div>
    </div>
    ` : ''}
    
    <div class="section">
        <div class="section-title">📜 เงื่อนไขทั่วไป</div>
        <ol class="terms-list">
            <li>ผู้เช่าตกลงชำระค่าเช่าภายในวันที่ 15 ของทุกเดือน หากชำระล่าช้าจะมีค่าปรับ</li>
            <li>ค่าไฟฟ้าเป็นค่าใช้จ่ายแยกต่างหาก โดยเรียกเก็บตามจริงในแต่ละเดือน ค่าน้ำประปาเหมาจ่าย</li>
            <li>ห้ามผู้เช่านำพื้นที่ไปให้บุคคลอื่นเช่าช่วง โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษร</li>
            <li>ผู้ให้เช่ามีสิทธิ์เข้าตรวจสอบพื้นที่ได้ โดยแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง</li>
            <li>เงินมัดจำจะคืนให้เมื่อสิ้นสุดสัญญา หลังหักค่าเสียหาย (ถ้ามี)</li>
            <li>หากผู้เช่าต้องการยกเลิกสัญญาก่อนกำหนด ต้องแจ้งล่วงหน้าไม่น้อยกว่า 30 วัน</li>
        </ol>
    </div>
    
    <div class="signatures">
        <div class="signature-box">
            ${contract.landlordSignatureUrl ? `
                <div class="signature-image">
                    <img src="${contract.landlordSignatureUrl}" alt="ลายเซ็นผู้ให้เช่า" />
                </div>
            ` : `
                <div class="signature-line"></div>
            `}
            <div class="signature-name">(${landlordName})</div>
            <div class="signature-label">ผู้ให้เช่า</div>
        </div>
        <div class="signature-box">
            ${contract.tenantSignatureUrl ? `
                <div class="signature-image">
                    <img src="${contract.tenantSignatureUrl}" alt="ลายเซ็นผู้เช่า" />
                </div>
            ` : `
                <div class="signature-line"></div>
            `}
            <div class="signature-name">(${shop.ownerName})</div>
            <div class="signature-label">ผู้เช่า</div>
        </div>
    </div>
    
    <div class="date-line">
        <strong>วันที่ลงนาม:</strong> ${contract.signedAt ? formatDate(contract.signedAt) : '_______________________________'}
    </div>
    
    <div class="footer">
        <p>เอกสารนี้สร้างโดยระบบบริหารจัดการตลาดลานใจใหญ่ | Lanjaiyai Market Management System</p>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}

// Generate Invoice PDF (using HTML print)
export interface InvoicePDFData {
    invoiceNumber: string;
    shopName: string;
    ownerName: string;
    items: { description: string; amount: number }[];
    totalAmount: number;
    dueDate: string;
    createdAt: string;
}

export function generateInvoicePDF(data: InvoicePDFData): void {
    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบแจ้งหนี้ ${data.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 20mm; }
        body {
            font-family: 'Sarabun', 'Noto Sans Thai', 'TH Sarabun New', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1a56db;
            padding-bottom: 20px;
        }
        .header h1 { font-size: 24px; color: #1a56db; }
        .header h2 { font-size: 14px; color: #666; }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .info-box {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
        }
        .info-label { font-size: 12px; color: #666; }
        .info-value { font-weight: 600; font-size: 15px; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th { background: #f3f4f6; font-weight: 600; }
        .total-row { font-weight: bold; font-size: 16px; background: #e0f2fe; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #888;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ใบแจ้งหนี้ / Invoice</h1>
        <h2>ตลาดลานใจใหญ่</h2>
    </div>
    
    <div class="info-row">
        <div class="info-box">
            <div class="info-label">เลขที่ใบแจ้งหนี้</div>
            <div class="info-value">${data.invoiceNumber}</div>
        </div>
        <div class="info-box">
            <div class="info-label">วันที่ออก</div>
            <div class="info-value">${formatDate(data.createdAt)}</div>
        </div>
        <div class="info-box">
            <div class="info-label">กำหนดชำระ</div>
            <div class="info-value" style="color: #dc2626;">${formatDate(data.dueDate)}</div>
        </div>
    </div>
    
    <div class="info-box" style="margin-bottom: 20px;">
        <div class="info-label">เรียกเก็บจาก</div>
        <div class="info-value">${data.shopName}</div>
        <div style="font-size: 13px; color: #666;">${data.ownerName}</div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 70%;">รายการ</th>
                <th style="text-align: right;">จำนวนเงิน</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">${formatCurrency(item.amount)}</td>
                </tr>
            `).join('')}
            <tr class="total-row">
                <td>รวมทั้งสิ้น</td>
                <td style="text-align: right; color: #1a56db;">${formatCurrency(data.totalAmount)}</td>
            </tr>
        </tbody>
    </table>
    
    <div class="footer">
        <p>กรุณาชำระเงินภายในวันที่กำหนด</p>
        <p>ติดต่อสอบถาม: ตลาดลานใจใหญ่</p>
    </div>
    
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}
