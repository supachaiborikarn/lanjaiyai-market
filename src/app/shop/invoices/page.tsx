'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    CreditCard,
    Receipt,
    ArrowLeft,
    Zap,
    Droplets,
    Home,
    Upload,
    XCircle,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    getShopById,
    getInvoicesByShop,
    getPendingInvoicesForShop,
    addInvoicePayment,
    getInvoicePaymentsByInvoice
} from '@/lib/storage-supabase';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { User, Shop, Invoice, InvoicePayment, INVOICE_STATUS_LABELS, INVOICE_ITEM_TYPE_LABELS } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { SlipUploader } from '@/components/ui/SlipUploader';
import { showToast } from '@/components/ui/Toast';
import { SlipAnalysisResult } from '@/types';
import Link from 'next/link';

export default function ShopInvoicesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [slipImageUrl, setSlipImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);

    const loadData = async () => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'shop_owner') {
            router.push('/');
            return;
        }

        setUser(currentUser);

        if (currentUser.shopId) {
            try {
                const [shopData, allInvoices, pending] = await Promise.all([
                    getShopById(currentUser.shopId),
                    getInvoicesByShop(currentUser.shopId),
                    getPendingInvoicesForShop(currentUser.shopId)
                ]);
                if (shopData) {
                    setShop(shopData);
                    setInvoices(allInvoices.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ));
                    setPendingInvoices(pending);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [router]);

    const getStatusBadge = (status: string) => {
        const classes: Record<string, string> = {
            draft: 'badge-secondary',
            sent: 'badge-warning',
            pending_verification: 'badge-info bg-blue-100 text-blue-800',
            paid: 'badge-success',
            payment_rejected: 'badge-danger',
            overdue: 'badge-danger',
            cancelled: 'badge-secondary'
        };
        return <span className={`badge ${classes[status] || 'badge-secondary'}`}>{INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS]}</span>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle size={20} className="text-green-600" />;
            case 'sent': return <Clock size={20} className="text-yellow-600" />;
            case 'pending_verification': return <Loader2 size={20} className="text-blue-600 animate-spin" />;
            case 'payment_rejected': return <XCircle size={20} className="text-red-600" />;
            case 'overdue': return <AlertCircle size={20} className="text-red-600" />;
            default: return <FileText size={20} className="text-gray-400" />;
        }
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'rent': return <Home size={16} className="text-blue-600" />;
            case 'electricity': return <Zap size={16} className="text-yellow-600" />;
            case 'water': return <Droplets size={16} className="text-blue-400" />;
            default: return <Receipt size={16} className="text-gray-600" />;
        }
    };

    const openDetailModal = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        // Load payment history for this invoice
        const payments = await getInvoicePaymentsByInvoice(invoice.id);
        setInvoicePayments(payments);
        setIsDetailModalOpen(true);
    };

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setSlipImageUrl('');
        setIsPaymentModalOpen(true);
    };

    const handleSlipAnalyzed = (imageUrl: string, result: SlipAnalysisResult) => {
        setSlipImageUrl(imageUrl);
    };

    const handleSubmitPayment = async () => {
        if (!selectedInvoice || !shop || !slipImageUrl) {
            showToast('กรุณาอัพโหลดสลิปการโอนเงิน', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await addInvoicePayment({
                invoiceId: selectedInvoice.id,
                shopId: shop.id,
                amount: selectedInvoice.totalAmount,
                slipImageUrl,
                paymentDate: new Date().toISOString(),
                status: 'pending'
            });

            showToast('ส่งสลิปการชำระเงินเรียบร้อย รอการตรวจสอบจาก Admin', 'success');
            setIsPaymentModalOpen(false);
            setIsDetailModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error submitting payment:', error);
            showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const pendingVerificationCount = invoices.filter(i => i.status === 'pending_verification').length;

    if (!user || !shop) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link href="/shop/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="page-title">ใบวางบิล</h1>
                        <p className="text-gray-500 mt-1">{shop.name}</p>
                    </div>
                </div>
            </div>

            {/* Pending Alert */}
            {pendingInvoices.length > 0 && (
                <div className="card p-6 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <AlertCircle size={24} className="text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-yellow-800">
                                คุณมีใบบิลรอชำระ {pendingInvoices.length} รายการ
                            </h3>
                            <p className="text-yellow-700 mt-1">
                                ยอดค้างชำระทั้งหมด: <span className="font-bold text-xl">{formatCurrency(totalPending)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                            <p className="text-sm text-gray-500">รอชำระ</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Loader2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingVerificationCount}</p>
                            <p className="text-sm text-gray-500">รอตรวจสอบ</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {invoices.filter(i => i.status === 'paid').length}
                            </p>
                            <p className="text-sm text-gray-500">ชำระแล้ว</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="card">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">รายการใบบิลทั้งหมด</h2>
                </div>
                <div className="divide-y">
                    {invoices.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText size={40} className="mx-auto mb-2 opacity-50" />
                            <p>ยังไม่มีใบบิล</p>
                        </div>
                    ) : (
                        invoices.map(invoice => (
                            <div
                                key={invoice.id}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => openDetailModal(invoice)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {getStatusIcon(invoice.status)}
                                        <div>
                                            <p className="font-medium">{invoice.invoiceNumber}</p>
                                            <p className="text-sm text-gray-500">
                                                {getMonthName(invoice.month)} • กำหนด {formatDate(invoice.dueDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                                        {getStatusBadge(invoice.status)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`ใบวางบิล ${selectedInvoice?.invoiceNumber || ''}`}
            >
                {selectedInvoice && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">เดือน</p>
                                    <p className="font-semibold text-lg">{getMonthName(selectedInvoice.month)}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(selectedInvoice.status)}
                                </div>
                            </div>
                            <div className="mt-4 text-sm">
                                <p className="text-gray-500">กำหนดชำระ</p>
                                <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                            </div>
                        </div>

                        {/* Payment Rejected Warning */}
                        {selectedInvoice.status === 'payment_rejected' && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                <div className="flex items-center gap-3">
                                    <XCircle size={24} className="text-red-600" />
                                    <div>
                                        <p className="font-semibold text-red-800">สลิปถูกปฏิเสธ</p>
                                        <p className="text-sm text-red-600">
                                            กรุณาตรวจสอบและส่งสลิปใหม่อีกครั้ง
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pending Verification Info */}
                        {selectedInvoice.status === 'pending_verification' && (
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <Loader2 size={24} className="text-blue-600 animate-spin" />
                                    <div>
                                        <p className="font-semibold text-blue-800">รอการตรวจสอบ</p>
                                        <p className="text-sm text-blue-600">
                                            สลิปของคุณกำลังถูกตรวจสอบโดย Admin
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Items */}
                        <div>
                            <h4 className="font-semibold mb-3">รายการ</h4>
                            <div className="space-y-2">
                                {selectedInvoice.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {getItemIcon(item.type)}
                                            <div>
                                                <span className="text-xs text-gray-500">
                                                    {INVOICE_ITEM_TYPE_LABELS[item.type]}
                                                </span>
                                                <p className="text-sm">{item.description}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment History */}
                        {invoicePayments.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3">ประวัติการชำระ</h4>
                                <div className="space-y-2">
                                    {invoicePayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {payment.status === 'verified' ? (
                                                    <CheckCircle size={16} className="text-green-600" />
                                                ) : payment.status === 'rejected' ? (
                                                    <XCircle size={16} className="text-red-600" />
                                                ) : (
                                                    <Clock size={16} className="text-yellow-600" />
                                                )}
                                                <div>
                                                    <p className="text-sm">{formatDate(payment.paymentDate)}</p>
                                                    {payment.verifyNote && (
                                                        <p className="text-xs text-gray-500">{payment.verifyNote}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium ${payment.status === 'verified' ? 'text-green-600' :
                                                    payment.status === 'rejected' ? 'text-red-600' :
                                                        'text-yellow-600'
                                                }`}>
                                                {payment.status === 'verified' ? 'อนุมัติ' :
                                                    payment.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between p-4 bg-blue-50 rounded-xl">
                            <span className="font-semibold text-lg">ยอดรวมทั้งสิ้น</span>
                            <span className="font-bold text-xl text-blue-700">
                                {formatCurrency(selectedInvoice.totalAmount)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary flex-1">
                                ปิด
                            </button>
                            {(selectedInvoice.status === 'sent' ||
                                selectedInvoice.status === 'overdue' ||
                                selectedInvoice.status === 'payment_rejected') && (
                                    <button
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            openPaymentModal(selectedInvoice);
                                        }}
                                        className="btn-primary flex-1"
                                    >
                                        <Upload size={18} />
                                        ชำระเงิน
                                    </button>
                                )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Modal with Slip Upload */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="ชำระเงิน"
            >
                {selectedInvoice && (
                    <div className="space-y-6">
                        {/* Invoice Info */}
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">ใบบิลเลขที่</p>
                                    <p className="font-semibold">{selectedInvoice.invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">ยอดที่ต้องชำระ</p>
                                    <p className="font-bold text-xl text-blue-700">
                                        {formatCurrency(selectedInvoice.totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bank Info */}
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <h4 className="font-semibold mb-3">ข้อมูลการโอนเงิน</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ธนาคาร:</span>
                                    <span className="font-medium">กสิกรไทย</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">เลขบัญชี:</span>
                                    <span className="font-medium">xxx-x-xxxxx-x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ชื่อบัญชี:</span>
                                    <span className="font-medium">ลานใจใหญ่</span>
                                </div>
                            </div>
                        </div>

                        {/* Slip Upload */}
                        <div>
                            <h4 className="font-semibold mb-3">อัพโหลดสลิปการโอนเงิน</h4>
                            <SlipUploader
                                onSlipAnalyzed={handleSlipAnalyzed}
                                expectedAmount={selectedInvoice.totalAmount}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="btn-secondary flex-1"
                                disabled={isSubmitting}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSubmitPayment}
                                className="btn-primary flex-1"
                                disabled={!slipImageUrl || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        กำลังส่ง...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={18} />
                                        ยืนยันการชำระ
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
