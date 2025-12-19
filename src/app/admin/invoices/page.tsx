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
    Loader2
} from 'lucide-react';
import {
    getShops,
    getInvoices,
    createMonthlyInvoices,
    sendInvoice,
    sendAllDraftInvoices,
    markInvoiceAsPaid,
    deleteInvoice
} from '@/lib/storage-supabase';
import { formatCurrency, formatDate, getMonthName, getCurrentMonth } from '@/lib/utils';
import { Shop, Invoice, INVOICE_STATUS_LABELS, INVOICE_ITEM_TYPE_LABELS } from '@/types';
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

    useEffect(() => {
        loadData();
    }, [selectedMonth]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopsData, invoicesData] = await Promise.all([
                getShops(),
                getInvoices()
            ]);
            setShops(shopsData);
            setInvoices(invoicesData.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
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

    const handleMarkAsPaid = async (invoice: Invoice) => {
        const result = await markInvoiceAsPaid(invoice.id);
        if (result) {
            showToast(`เคลียร์บิล ${invoice.invoiceNumber} สำเร็จ`, 'success');
            await loadData();
            setIsDetailModalOpen(false);
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

    const openDetailModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const classes: Record<string, string> = {
            draft: 'badge-secondary',
            sent: 'badge-warning',
            paid: 'badge-success',
            overdue: 'badge-danger',
            cancelled: 'badge-secondary'
        };
        return <span className={`badge ${classes[status]}`}>{INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS]}</span>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle size={20} className="text-green-600" />;
            case 'sent': return <Clock size={20} className="text-yellow-600" />;
            case 'overdue': return <AlertCircle size={20} className="text-red-600" />;
            default: return <FileText size={20} className="text-gray-400" />;
        }
    };

    // Stats
    const draftCount = filteredInvoices.filter(i => i.status === 'draft').length;
    const sentCount = filteredInvoices.filter(i => i.status === 'sent').length;
    const paidCount = filteredInvoices.filter(i => i.status === 'paid').length;
    const totalAmount = filteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
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
            <div className="page-header">
                <div>
                    <h1 className="page-title">ใบวางบิล</h1>
                    <p className="text-gray-500 mt-1">จัดการใบวางบิลและแจ้งหนี้ร้านค้า</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSendAll}
                        className="btn-secondary"
                        disabled={draftCount === 0}
                    >
                        <Send size={18} />
                        ส่งทั้งหมด ({draftCount})
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        สร้างใบบิลรายเดือน
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText size={20} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{filteredInvoices.length}</p>
                            <p className="text-sm text-gray-500">ใบบิลทั้งหมด</p>
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
                            <option value="paid">ชำระแล้ว</option>
                            <option value="overdue">เกินกำหนด</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>เลขที่ใบบิล</th>
                                <th>ร้านค้า</th>
                                <th>ยอดรวม</th>
                                <th>กำหนดชำระ</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
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
                                                    {invoice.status === 'sent' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(invoice)}
                                                            className="p-2 hover:bg-green-100 rounded-lg"
                                                            title="เคลียร์บิล"
                                                        >
                                                            <CheckCircle size={18} className="text-green-600" />
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
                            {selectedInvoice.status === 'draft' && (
                                <button
                                    onClick={() => {
                                        handleSendInvoice(selectedInvoice);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="btn-primary flex-1"
                                >
                                    <Send size={18} />
                                    ส่งแจ้งร้านค้า
                                </button>
                            )}
                            {selectedInvoice.status === 'sent' && (
                                <button
                                    onClick={() => handleMarkAsPaid(selectedInvoice)}
                                    className="btn-success flex-1"
                                >
                                    <CheckCircle size={18} />
                                    เคลียร์บิล
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
