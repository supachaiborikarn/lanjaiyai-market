'use client';

import { useEffect, useState } from 'react';
import {
    CreditCard,
    Search,
    FileImage,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Filter,
    Plus
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SlipUploader } from '@/components/ui/SlipUploader';
import { showToast } from '@/components/ui/Toast';
import {
    getShops,
    getInvoices,
    getAllInvoicePayments,
    addInvoicePayment,
    verifyInvoicePayment,
    getCurrentUser
} from '@/lib/storage-supabase';
import { formatCurrency, formatDate, getCurrentMonth, getMonthName } from '@/lib/utils';
import { Shop, Invoice, InvoicePayment, SlipAnalysisResult } from '@/types';

// Extended type to include invoice info
interface PaymentWithInvoice extends InvoicePayment {
    invoice?: Invoice;
    shop?: Shop;
}

const PAYMENT_STATUS_LABELS = {
    pending: 'รอตรวจสอบ',
    verified: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ'
};

export default function PaymentsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoicePayments, setInvoicePayments] = useState<PaymentWithInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isViewSlipModalOpen, setIsViewSlipModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentWithInvoice | null>(null);
    const [verifyNote, setVerifyNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add payment modal state
    const [addFormData, setAddFormData] = useState({
        invoiceId: '',
        shopId: '',
        amount: 0,
        slipImageUrl: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopsData, invoicesData, paymentsData] = await Promise.all([
                getShops(),
                getInvoices(),
                getAllInvoicePayments()
            ]);
            setShops(shopsData);
            setInvoices(invoicesData);

            // Enrich payments with invoice and shop info
            const enrichedPayments: PaymentWithInvoice[] = paymentsData.map(payment => {
                const invoice = invoicesData.find(i => i.id === payment.invoiceId);
                const shop = shopsData.find(s => s.id === payment.shopId);
                return { ...payment, invoice, shop };
            });

            setInvoicePayments(enrichedPayments);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unpaid invoices for manual payment
    const getUnpaidInvoices = () => {
        return invoices.filter(i =>
            i.status === 'sent' ||
            i.status === 'overdue' ||
            i.status === 'payment_rejected'
        );
    };

    const filteredPayments = invoicePayments.filter(payment => {
        const matchesSearch = payment.shop?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.invoice?.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleSlipAnalyzed = (imageUrl: string, result: SlipAnalysisResult) => {
        setAddFormData(prev => ({
            ...prev,
            slipImageUrl: imageUrl
        }));
    };

    const handleAddPayment = async () => {
        if (!addFormData.invoiceId || !addFormData.slipImageUrl) {
            showToast('กรุณาเลือกใบวางบิลและอัพโหลดสลิป', 'error');
            return;
        }

        const selectedInvoice = invoices.find(i => i.id === addFormData.invoiceId);
        if (!selectedInvoice) {
            showToast('ไม่พบใบวางบิล', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await addInvoicePayment({
                invoiceId: addFormData.invoiceId,
                shopId: selectedInvoice.shopId,
                amount: selectedInvoice.totalAmount,
                slipImageUrl: addFormData.slipImageUrl,
                paymentDate: new Date().toISOString(),
                status: 'pending'
            });

            showToast('บันทึกการชำระเงินเรียบร้อย รอการตรวจสอบ', 'success');
            await loadData();
            setIsAddModalOpen(false);
            setAddFormData({
                invoiceId: '',
                shopId: '',
                amount: 0,
                slipImageUrl: ''
            });
        } catch (error) {
            console.error('Error adding payment:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openVerifyModal = (payment: PaymentWithInvoice) => {
        setSelectedPayment(payment);
        setVerifyNote('');
        setIsVerifyModalOpen(true);
    };

    const handleVerify = async (status: 'verified' | 'rejected') => {
        if (!selectedPayment) return;

        const currentUser = getCurrentUser();
        if (!currentUser) {
            showToast('กรุณาเข้าสู่ระบบใหม่', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await verifyInvoicePayment(
                selectedPayment.id,
                status,
                currentUser.id,
                verifyNote
            );
            showToast(
                status === 'verified' ? 'อนุมัติการชำระเงินเรียบร้อย' : 'ปฏิเสธการชำระเงินเรียบร้อย',
                status === 'verified' ? 'success' : 'info'
            );
            setIsVerifyModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error verifying payment:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const classes = {
            pending: 'badge-warning',
            verified: 'badge-success',
            rejected: 'badge-danger'
        };
        return <span className={`badge ${classes[status as keyof typeof classes]}`}>{PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS]}</span>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle size={16} className="text-green-600" />;
            case 'rejected':
                return <XCircle size={16} className="text-red-600" />;
            default:
                return <Clock size={16} className="text-yellow-600" />;
        }
    };

    // Generate month options
    const monthOptions = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthOptions.push({ value, label: getMonthName(value) });
    }

    // Stats
    const pendingCount = invoicePayments.filter(p => p.status === 'pending').length;
    const verifiedCount = invoicePayments.filter(p => p.status === 'verified').length;
    const verifiedAmount = invoicePayments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">การชำระเงิน</h1>
                    <p className="text-gray-500 mt-1">จัดการการรับชำระเงินและตรวจสอบสลิป</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    เพิ่มการชำระเงิน
                </button>
            </div>

            {/* Pending Alert */}
            {pendingCount > 0 && (
                <div className="card p-4 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock size={24} className="text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-800">
                                มีสลิปรอตรวจสอบ {pendingCount} รายการ
                            </h3>
                            <p className="text-sm text-yellow-600 mt-1">
                                กรุณาตรวจสอบและอนุมัติการชำระเงินจากร้านค้า
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingCount}</p>
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
                            <p className="text-2xl font-bold">{verifiedCount}</p>
                            <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(verifiedAmount)}</p>
                            <p className="text-sm text-gray-500">ยอดรับแล้ว</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <h2 className="text-lg font-semibold flex-1">ประวัติการชำระเงิน</h2>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหา..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="input pl-11 w-48"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="select w-auto"
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="pending">รอตรวจสอบ</option>
                            <option value="verified">อนุมัติแล้ว</option>
                            <option value="rejected">ปฏิเสธ</option>
                        </select>
                    </div>
                </div>

                {filteredPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>วันที่</th>
                                    <th>ร้านค้า</th>
                                    <th>เลขใบบิล</th>
                                    <th>จำนวนเงิน</th>
                                    <th>สลิป</th>
                                    <th>สถานะ</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map(payment => (
                                    <tr key={payment.id}>
                                        <td className="text-sm">{formatDate(payment.paymentDate)}</td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {payment.shop?.stallNumber}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{payment.shop?.name || 'ไม่พบข้อมูล'}</p>
                                                    <p className="text-xs text-gray-500">{payment.shop?.ownerName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm font-medium text-blue-600">
                                                {payment.invoice?.invoiceNumber || '-'}
                                            </span>
                                        </td>
                                        <td className="font-semibold">{formatCurrency(payment.amount)}</td>
                                        <td>
                                            {payment.slipImageUrl ? (
                                                <button
                                                    onClick={() => { setSelectedPayment(payment); setIsViewSlipModalOpen(true); }}
                                                    className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                                                >
                                                    <FileImage size={16} />
                                                    ดูสลิป
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">ไม่มีสลิป</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(payment.status)}
                                                {getStatusBadge(payment.status)}
                                            </div>
                                        </td>
                                        <td>
                                            {payment.status === 'pending' && payment.slipImageUrl && (
                                                <button
                                                    onClick={() => openVerifyModal(payment)}
                                                    className="btn btn-primary p-2"
                                                    title="ตรวจสอบ"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                        <p>ยังไม่มีประวัติการชำระเงิน</p>
                    </div>
                )}
            </div>

            {/* Add Payment Modal - สำหรับ Admin ลงข้อมูลแทนร้านค้า */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="เพิ่มการชำระเงิน (ลงแทนร้านค้า)"
                size="lg"
                footer={
                    <>
                        <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleAddPayment}
                            className="btn btn-primary"
                            disabled={!addFormData.invoiceId || !addFormData.slipImageUrl || isSubmitting}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-700">
                            <strong>💡 สำหรับกรณีที่ร้านค้าส่งสลิปมาทางไลน์</strong><br />
                            Admin สามารถอัพโหลดสลิปและลงข้อมูลการชำระเงินแทนร้านค้าได้ที่นี่
                        </p>
                    </div>

                    <div>
                        <label className="label">เลือกใบวางบิล *</label>
                        <select
                            value={addFormData.invoiceId}
                            onChange={e => {
                                const invoice = invoices.find(i => i.id === e.target.value);
                                setAddFormData({
                                    ...addFormData,
                                    invoiceId: e.target.value,
                                    shopId: invoice?.shopId || '',
                                    amount: invoice?.totalAmount || 0
                                });
                            }}
                            className="select"
                        >
                            <option value="">-- เลือกใบวางบิล --</option>
                            {getUnpaidInvoices().map(invoice => {
                                const shop = shops.find(s => s.id === invoice.shopId);
                                return (
                                    <option key={invoice.id} value={invoice.id}>
                                        {invoice.invoiceNumber} - {shop?.name} ({formatCurrency(invoice.totalAmount)})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {addFormData.invoiceId && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">ร้านค้า</p>
                                    <p className="font-medium">{shops.find(s => s.id === addFormData.shopId)?.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">ยอดที่ต้องชำระ</p>
                                    <p className="font-bold text-lg text-green-600">{formatCurrency(addFormData.amount)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">แนบสลิปการชำระเงิน *</label>
                        <SlipUploader
                            onSlipAnalyzed={handleSlipAnalyzed}
                            expectedAmount={addFormData.amount}
                        />
                    </div>
                </div>
            </Modal>

            {/* Verify Slip Modal */}
            <Modal
                isOpen={isVerifyModalOpen}
                onClose={() => setIsVerifyModalOpen(false)}
                title="ตรวจสอบสลิป"
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => handleVerify('rejected')}
                            className="btn btn-danger"
                            disabled={isSubmitting}
                        >
                            <XCircle size={16} />
                            ไม่ผ่าน
                        </button>
                        <button
                            onClick={() => handleVerify('verified')}
                            className="btn btn-success"
                            disabled={isSubmitting}
                        >
                            <CheckCircle size={16} />
                            อนุมัติ
                        </button>
                    </>
                }
            >
                {selectedPayment && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-medium">{selectedPayment.shop?.name}</p>
                                <p className="text-sm text-gray-500">{selectedPayment.invoice?.invoiceNumber}</p>
                            </div>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                        </div>

                        {selectedPayment.slipImageUrl && (
                            <div className="rounded-xl overflow-hidden border">
                                <img
                                    src={selectedPayment.slipImageUrl}
                                    alt="Payment slip"
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div>
                            <label className="label">หมายเหตุ (ถ้ามี)</label>
                            <textarea
                                value={verifyNote}
                                onChange={e => setVerifyNote(e.target.value)}
                                className="input"
                                rows={2}
                                placeholder="ระบุหมายเหตุ เช่น ยอดไม่ตรง, สลิปไม่ชัด..."
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* View Slip Modal */}
            <Modal
                isOpen={isViewSlipModalOpen}
                onClose={() => setIsViewSlipModalOpen(false)}
                title="สลิปการชำระเงิน"
                size="lg"
            >
                {selectedPayment && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-medium">{selectedPayment.shop?.name}</p>
                                <p className="text-sm text-gray-500">{formatDate(selectedPayment.paymentDate)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                                {getStatusBadge(selectedPayment.status)}
                            </div>
                        </div>

                        {selectedPayment.slipImageUrl && (
                            <div className="rounded-xl overflow-hidden border">
                                <img
                                    src={selectedPayment.slipImageUrl}
                                    alt="Payment slip"
                                    className="w-full"
                                />
                            </div>
                        )}

                        {selectedPayment.verifyNote && (
                            <div className="p-4 bg-red-50 rounded-xl">
                                <p className="text-red-700 text-sm"><strong>หมายเหตุ:</strong> {selectedPayment.verifyNote}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
