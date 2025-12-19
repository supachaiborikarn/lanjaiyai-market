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
    Home
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getCurrentUser,
    getShopById,
    getInvoicesByShop,
    getPendingInvoicesForShop
} from '@/lib/storage';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { User, Shop, Invoice, INVOICE_STATUS_LABELS, INVOICE_ITEM_TYPE_LABELS } from '@/types';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

export default function ShopInvoicesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'shop_owner') {
            router.push('/');
            return;
        }

        setUser(currentUser);

        if (currentUser.shopId) {
            const shopData = getShopById(currentUser.shopId);
            if (shopData) {
                setShop(shopData);
                setInvoices(getInvoicesByShop(shopData.id).sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
                setPendingInvoices(getPendingInvoicesForShop(shopData.id));
            }
        }
    }, [router]);

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

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'rent': return <Home size={16} className="text-blue-600" />;
            case 'electricity': return <Zap size={16} className="text-yellow-600" />;
            case 'water': return <Droplets size={16} className="text-blue-400" />;
            default: return <Receipt size={16} className="text-gray-600" />;
        }
    };

    const openDetailModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    };

    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

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
                            <div className="mt-4">
                                <Link href="/shop/payments" className="btn-primary">
                                    <CreditCard size={18} />
                                    ไปชำระเงิน
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
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
                            {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
                                <Link href="/shop/payments" className="btn-primary flex-1 text-center">
                                    <CreditCard size={18} />
                                    ชำระเงิน
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
