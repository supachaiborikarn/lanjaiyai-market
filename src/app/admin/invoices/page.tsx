'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    Plus,
    Send,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Trash2,
    Filter,
    Calendar,
    Store,
    Receipt,
    Loader2,
    XCircle,
    Image
} from 'lucide-react';
import {
    getShops,
    getInvoices,
    createMonthlyInvoices,
    sendInvoice,
    sendAllDraftInvoices,
    deleteInvoice,
    getPendingInvoicePayments,
    getInvoicePaymentsByInvoice,
    verifyInvoicePayment,
    getCurrentUser,
    markInvoiceAsPaid
} from '@/lib/storage-supabase';
import { formatCurrency, formatDate, getMonthName, getCurrentMonth } from '@/lib/utils';
import { Shop, Invoice, InvoicePayment, INVOICE_STATUS_LABELS, INVOICE_ITEM_TYPE_LABELS } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';

export default function InvoicesPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [pendingPayments, setPendingPayments] = useState<InvoicePayment[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<InvoicePayment | null>(null);
    const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
    const [verifyNote, setVerifyNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManualClearModalOpen, setIsManualClearModalOpen] = useState(false);
    const [manualClearNote, setManualClearNote] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedMonth]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopsData, invoicesData, pendingPaymentsData] = await Promise.all([
                getShops(),
                getInvoices(),
                getPendingInvoicePayments()
            ]);
            setShops(shopsData);
            setInvoices(invoicesData.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
            setPendingPayments(pendingPaymentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShop = (shopId: string) => shops.find(s => s.id === shopId);

    const filteredInvoices = invoices.filter(invoice => {
        const matchesMonth = invoice.month === selectedMonth;
        const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
        return matchesMonth && matchesStatus;
    });

    const handleCreateMonthlyInvoices = async () => {
        try {
            const newInvoices = await createMonthlyInvoices(selectedMonth);
            if (newInvoices.length > 0) {
                showToast(`สร้างใบบิลสำเร็จ ${newInvoices.length} ใบ`, 'success');
                await loadData();
            } else {
                showToast('ร้านค้าทั้งหมดมีใบบิลแล้ว', 'info');
            }
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating invoices:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleSendInvoice = async (invoice: Invoice) => {
        const result = await sendInvoice(invoice.id);
        if (result) {
            showToast(`ส่งใบบิล ${invoice.invoiceNumber} สำเร็จ`, 'success');
            await loadData();
        }
    };

    const handleSendAll = async () => {
        const count = await sendAllDraftInvoices(selectedMonth);
        if (count > 0) {
            showToast(`ส่งใบบิลสำเร็จ ${count} ใบ`, 'success');
            await loadData();
        } else {
            showToast('ไม่มีใบบิลที่รอส่ง', 'info');
        }
    };

    const handleDelete = async (invoice: Invoice) => {
        if (confirm(`ต้องการลบใบบิล ${invoice.invoiceNumber} หรือไม่?`)) {
            const result = await deleteInvoice(invoice.id);
            if (result) {
                showToast('ลบใบบิลสำเร็จ', 'success');
                await loadData();
            }
        }
    };

    const openDetailModal = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        // Load payment history for this invoice
        const payments = await getInvoicePaymentsByInvoice(invoice.id);
        setInvoicePayments(payments);
        setIsDetailModalOpen(true);
    };

    const openVerifyModal = (payment: InvoicePayment) => {
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
            setIsDetailModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error verifying payment:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualClear = async () => {
        if (!selectedInvoice) return;

        setIsSubmitting(true);
        try {
            await markInvoiceAsPaid(selectedInvoice.id);
            showToast(`เคลียร์บิล ${selectedInvoice.invoiceNumber} สำเร็จ`, 'success');
            setIsManualClearModalOpen(false);
            setIsDetailModalOpen(false);
            setManualClearNote('');
            await loadData();
        } catch (error) {
            console.error('Error clearing invoice:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    // Stats
    const draftCount = filteredInvoices.filter(i => i.status === 'draft').length;
    const sentCount = filteredInvoices.filter(i => i.status === 'sent').length;
    const pendingVerificationCount = filteredInvoices.filter(i => i.status === 'pending_verification').length;
    const paidCount = filteredInvoices.filter(i => i.status === 'paid').length;
    const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

    // Generate month options
    const monthOptions = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthOptions.push({ value, label: getMonthName(value) });
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="page-title">ใบวางบิล</h1>
                        <p className="text-gray-500 mt-1 text-sm hidden sm:block">จัดการใบวางบิลและแจ้งหนี้ร้านค้า</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleSendAll}
                            className="btn-secondary text-sm w-full sm:w-auto"
                            disabled={draftCount === 0}
                        >
                            <Send size={18} />
                            ส่งทั้งหมด ({draftCount})
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn-primary text-sm w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            สร้างใบบิล
                        </button>
                    </div>
                </div>
            </div>

            {/* Pending Verification Alert */}
            {pendingPayments.length > 0 && (
                <div className="card p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Image size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-800">
                                มีสลิปรอตรวจสอบ {pendingPayments.length} รายการ
                            </h3>
                            <p className="text-sm text-blue-600 mt-1">
                                กดดู Invoice ที่สถานะ "รอตรวจสอบสลิป" เพื่อตรวจสอบและอนุมัติ
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText size={20} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{filteredInvoices.length}</p>
                            <p className="text-sm text-gray-500">ทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{sentCount}</p>
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
                            <p className="text-2xl font-bold">{paidCount}</p>
                            <p className="text-sm text-gray-500">ชำระแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Receipt size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(paidAmount)}</p>
                            <p className="text-sm text-gray-500">ยอดรับแล้ว</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-500" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-field"
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-field"
                        >
                            <option value="all">ทุกสถานะ</option>
                            <option value="draft">ฉบับร่าง</option>
                            <option value="sent">ส่งแล้ว</option>
                            <option value="pending_verification">รอตรวจสอบสลิป</option>
                            <option value="paid">ชำระแล้ว</option>
                            <option value="payment_rejected">สลิปถูกปฏิเสธ</option>
                            <option value="overdue">เกินกำหนด</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th className="whitespace-nowrap">เลขที่ใบบิล</th>
                                <th className="whitespace-nowrap">ร้านค้า</th>
                                <th className="whitespace-nowrap">ยอดรวม</th>
                                <th className="whitespace-nowrap">กำหนดชำระ</th>
                                <th className="whitespace-nowrap">สถานะ</th>
                                <th className="whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        <FileText size={40} className="mx-auto mb-2 opacity-50" />
                                        <p>ไม่มีใบบิลในเดือนนี้</p>
                                        <button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="mt-3 text-blue-600 hover:underline"
                                        >
                                            สร้างใบบิลใหม่
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map(invoice => {
                                    const shop = getShop(invoice.shopId);
                                    return (
                                        <tr key={invoice.id}>
                                            <td>
                                                <span className="font-medium">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <Store size={16} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{shop?.name || 'ไม่พบข้อมูล'}</p>
                                                        <p className="text-xs text-gray-500">แผง {shop?.stallNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span>
                                            </td>
                                            <td>
                                                <span className="text-sm">{formatDate(invoice.dueDate)}</span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(invoice.status)}
                                                    {getStatusBadge(invoice.status)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openDetailModal(invoice)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={18} className="text-gray-600" />
                                                    </button>
                                                    {invoice.status === 'draft' && (
                                                        <button
                                                            onClick={() => handleSendInvoice(invoice)}
                                                            className="p-2 hover:bg-blue-100 rounded-lg"
                                                            title="ส่งแจ้งร้านค้า"
                                                        >
                                                            <Send size={18} className="text-blue-600" />
                                                        </button>
                                                    )}
                                                    {invoice.status === 'draft' && (
                                                        <button
                                                            onClick={() => handleDelete(invoice)}
                                                            className="p-2 hover:bg-red-100 rounded-lg"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 size={18} className="text-red-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="สร้างใบบิลรายเดือน"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-blue-800">
                            <strong>เดือนที่เลือก:</strong> {getMonthName(selectedMonth)}
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                            ระบบจะสร้างใบบิลให้ร้านค้าที่ยังไม่มีใบบิลในเดือนนี้ <br />
                            รวมค่าเช่า + ค่าน้ำไฟ (ถ้ามีข้อมูลมิเตอร์)
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsCreateModalOpen(false)} className="btn-secondary flex-1">
                            ยกเลิก
                        </button>
                        <button onClick={handleCreateMonthlyInvoices} className="btn-primary flex-1">
                            <Plus size={18} />
                            สร้างใบบิล
                        </button>
                    </div>
                </div>
            </Modal>

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
                                    <p className="text-sm text-gray-500">ร้านค้า</p>
                                    <p className="font-semibold text-lg">{getShop(selectedInvoice.shopId)?.name}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(selectedInvoice.status)}
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">เดือน</p>
                                    <p className="font-medium">{getMonthName(selectedInvoice.month)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">กำหนดชำระ</p>
                                    <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h4 className="font-semibold mb-3">รายการ</h4>
                            <div className="space-y-2">
                                {selectedInvoice.items.map((item, index) => (
                                    <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="badge badge-secondary text-xs mr-2">
                                                {INVOICE_ITEM_TYPE_LABELS[item.type]}
                                            </span>
                                            <span className="text-sm">{item.description}</span>
                                        </div>
                                        <span className="font-semibold">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment History & Slip Preview */}
                        {invoicePayments.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3">ประวัติการชำระ / สลิป</h4>
                                <div className="space-y-3">
                                    {invoicePayments.map((payment) => (
                                        <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {payment.status === 'verified' ? (
                                                        <CheckCircle size={16} className="text-green-600" />
                                                    ) : payment.status === 'rejected' ? (
                                                        <XCircle size={16} className="text-red-600" />
                                                    ) : (
                                                        <Clock size={16} className="text-yellow-600" />
                                                    )}
                                                    <span className="text-sm">{formatDate(payment.paymentDate)}</span>
                                                </div>
                                                <span className={`text-sm font-medium ${payment.status === 'verified' ? 'text-green-600' :
                                                    payment.status === 'rejected' ? 'text-red-600' :
                                                        'text-yellow-600'
                                                    }`}>
                                                    {payment.status === 'verified' ? 'อนุมัติแล้ว' :
                                                        payment.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                                                </span>
                                            </div>

                                            {/* Slip Image */}
                                            {payment.slipImageUrl && (
                                                <div className="mb-3">
                                                    <img
                                                        src={payment.slipImageUrl}
                                                        alt="สลิปการโอนเงิน"
                                                        className="rounded-lg max-h-64 w-auto mx-auto"
                                                    />
                                                </div>
                                            )}

                                            {/* Verify Note */}
                                            {payment.verifyNote && (
                                                <p className="text-sm text-gray-600 bg-white p-2 rounded">
                                                    <strong>หมายเหตุ:</strong> {payment.verifyNote}
                                                </p>
                                            )}

                                            {/* Verify Button */}
                                            {payment.status === 'pending' && (
                                                <button
                                                    onClick={() => openVerifyModal(payment)}
                                                    className="btn-primary w-full mt-3"
                                                >
                                                    <Eye size={18} />
                                                    ตรวจสอบสลิป
                                                </button>
                                            )}
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
                        <div className="flex flex-col gap-3">
                            {selectedInvoice.status === 'draft' && (
                                <button
                                    onClick={() => {
                                        handleSendInvoice(selectedInvoice);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="btn-primary w-full"
                                >
                                    <Send size={18} />
                                    ส่งแจ้งร้านค้า
                                </button>
                            )}
                            {(selectedInvoice.status === 'sent' ||
                                selectedInvoice.status === 'pending_verification' ||
                                selectedInvoice.status === 'payment_rejected') && (
                                    <button
                                        onClick={() => setIsManualClearModalOpen(true)}
                                        className="btn-success w-full"
                                    >
                                        <CheckCircle size={18} />
                                        เคลียร์บิลด้วยตนเอง
                                    </button>
                                )}
                            <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary w-full">
                                ปิด
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Verify Modal */}
            <Modal
                isOpen={isVerifyModalOpen}
                onClose={() => setIsVerifyModalOpen(false)}
                title="ตรวจสอบสลิปการชำระเงิน"
            >
                {selectedPayment && (
                    <div className="space-y-6">
                        {/* Slip Image */}
                        {selectedPayment.slipImageUrl && (
                            <div className="text-center">
                                <img
                                    src={selectedPayment.slipImageUrl}
                                    alt="สลิปการโอนเงิน"
                                    className="rounded-lg max-h-80 w-auto mx-auto border"
                                />
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">ยอดที่ต้องชำระ</p>
                                    <p className="font-bold text-lg text-blue-700">
                                        {formatCurrency(selectedPayment.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">วันที่ส่งสลิป</p>
                                    <p className="font-medium">{formatDate(selectedPayment.paymentDate)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Note Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                หมายเหตุ (ถ้ามี)
                            </label>
                            <textarea
                                value={verifyNote}
                                onChange={(e) => setVerifyNote(e.target.value)}
                                className="input-field w-full"
                                rows={3}
                                placeholder="ระบุหมายเหตุ เช่น ยอดไม่ตรง, สลิปไม่ชัด..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleVerify('rejected')}
                                className="btn-danger flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <XCircle size={18} />
                                )}
                                ปฏิเสธ
                            </button>
                            <button
                                onClick={() => handleVerify('verified')}
                                className="btn-success flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                                อนุมัติ
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Manual Clear Confirmation Modal */}
            <Modal
                isOpen={isManualClearModalOpen}
                onClose={() => setIsManualClearModalOpen(false)}
                title="เคลียร์บิลด้วยตนเอง"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-yellow-800">คำเตือน</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    การเคลียร์บิลด้วยตนเองจะทำให้ใบบิลถูกปิดโดยไม่มีหลักฐานสลิป
                                    กรุณาใช้ในกรณีที่ลูกค้าชำระเงินสดหรือมีเหตุจำเป็นเท่านั้น
                                </p>
                            </div>
                        </div>
                    </div>

                    {selectedInvoice && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">ใบบิลเลขที่</p>
                                    <p className="font-semibold">{selectedInvoice.invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">ยอดรวม</p>
                                    <p className="font-bold text-lg text-blue-700">
                                        {formatCurrency(selectedInvoice.totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsManualClearModalOpen(false)}
                            className="btn-secondary flex-1"
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleManualClear}
                            className="btn-success flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            ยืนยันเคลียร์บิล
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
