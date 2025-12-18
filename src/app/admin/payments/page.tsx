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
    Filter
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SlipUploader } from '@/components/ui/SlipUploader';
import { showToast } from '@/components/ui/Toast';
import {
    getShops,
    getPayments,
    getMeterReadings,
    addPayment,
    updatePayment,
    updateMeterReading
} from '@/lib/storage';
import { formatCurrency, formatDate, getCurrentMonth, getMonthName } from '@/lib/utils';
import { Shop, Payment, MeterReading, SlipAnalysisResult, SLIP_STATUS_LABELS, PAYMENT_TYPE_LABELS } from '@/types';

export default function PaymentsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isViewSlipModalOpen, setIsViewSlipModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    // Form state
    const [addFormData, setAddFormData] = useState({
        shopId: '',
        type: 'utilities' as 'rent' | 'utilities' | 'other',
        amount: 0,
        description: '',
        slipImageUrl: '',
        slipVerifyStatus: 'pending' as 'pending' | 'verified' | 'rejected'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setShops(getShops());
        setPayments(getPayments());
        setMeters(getMeterReadings());
    };

    const getShop = (shopId: string) => shops.find(s => s.id === shopId);

    const filteredPayments = payments.filter(payment => {
        const shop = getShop(payment.shopId);
        const matchesSearch = shop?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop?.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || payment.slipVerifyStatus === filterStatus;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get pending utilities for selected month
    const getPendingUtilities = () => {
        const monthMeters = meters.filter(m => m.month === selectedMonth && m.status === 'pending');
        return monthMeters.map(meter => ({
            meter,
            shop: getShop(meter.shopId)
        })).filter(item => item.shop);
    };

    const pendingUtilities = getPendingUtilities();

    const openAddPaymentModal = (shop: Shop, meter?: MeterReading) => {
        setSelectedShop(shop);
        const shopMeter = meter || meters.find(m => m.shopId === shop.id && m.month === selectedMonth);

        setAddFormData({
            shopId: shop.id,
            type: 'utilities',
            amount: shopMeter?.totalCost || shop.monthlyRent,
            description: shopMeter ? `ค่าสาธารณูปโภค ${getMonthName(selectedMonth)}` : 'ค่าเช่า',
            slipImageUrl: '',
            slipVerifyStatus: 'pending'
        });
        setIsAddModalOpen(true);
    };

    const handleSlipAnalyzed = (imageUrl: string, result: SlipAnalysisResult) => {
        setAddFormData(prev => ({
            ...prev,
            slipImageUrl: imageUrl,
            slipVerifyStatus: result.isValid ? 'verified' : 'pending'
        }));
    };

    const handleAddPayment = () => {
        addPayment({
            shopId: addFormData.shopId,
            paymentDate: new Date().toISOString(),
            amount: addFormData.amount,
            type: addFormData.type,
            description: addFormData.description,
            slipImageUrl: addFormData.slipImageUrl,
            slipVerifyStatus: addFormData.slipVerifyStatus,
            verifiedAt: addFormData.slipVerifyStatus === 'verified' ? new Date().toISOString() : undefined
        });

        // Mark meter as paid if utilities payment
        if (addFormData.type === 'utilities') {
            const meter = meters.find(m => m.shopId === addFormData.shopId && m.month === selectedMonth);
            if (meter) {
                updateMeterReading(meter.id, { status: 'paid' });
            }
        }

        showToast('บันทึกการชำระเงินเรียบร้อย', 'success');
        loadData();
        setIsAddModalOpen(false);
    };

    const openVerifyModal = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsVerifyModalOpen(true);
    };

    const handleVerify = (status: 'verified' | 'rejected', note?: string) => {
        if (selectedPayment) {
            updatePayment(selectedPayment.id, {
                slipVerifyStatus: status,
                slipVerifyNote: note,
                verifiedAt: new Date().toISOString()
            });
            showToast(status === 'verified' ? 'ยืนยันสลิปเรียบร้อย' : 'ปฏิเสธสลิป', status === 'verified' ? 'success' : 'error');
            loadData();
            setIsVerifyModalOpen(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const classes = {
            pending: 'badge-warning',
            verified: 'badge-success',
            rejected: 'badge-danger'
        };
        return <span className={`badge ${classes[status as keyof typeof classes]}`}>{SLIP_STATUS_LABELS[status as keyof typeof SLIP_STATUS_LABELS]}</span>;
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

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">การชำระเงิน</h1>
                    <p className="text-gray-500 mt-1">จัดการการรับชำระเงินและตรวจสอบสลิป</p>
                </div>
            </div>

            {/* Month Selector & Pending Utilities */}
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">ค่าสาธารณูปโภครอชำระ</h2>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="input w-auto"
                    />
                </div>

                {pendingUtilities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingUtilities.map(({ meter, shop }) => shop && (
                            <div key={meter.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {shop.stallNumber}
                                        </div>
                                        <div>
                                            <p className="font-medium">{shop.name}</p>
                                            <p className="text-sm text-gray-500">{shop.ownerName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">ค่าไฟ ({meter.unitsUsed} หน่วย)</span>
                                        <span>{formatCurrency(meter.electricityCost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">ค่าน้ำ</span>
                                        <span>{formatCurrency(meter.waterCost)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>รวม</span>
                                        <span className="text-green-600">{formatCurrency(meter.totalCost)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openAddPaymentModal(shop, meter)}
                                    className="btn btn-primary w-full"
                                >
                                    <CreditCard size={16} />
                                    บันทึกการชำระ
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <CheckCircle size={40} className="mx-auto mb-2 opacity-50 text-green-500" />
                        <p>ไม่มียอดค้างชำระสำหรับเดือนนี้</p>
                    </div>
                )}
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
                            <option value="verified">ผ่านแล้ว</option>
                            <option value="rejected">ไม่ผ่าน</option>
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
                                    <th>ประเภท</th>
                                    <th>จำนวนเงิน</th>
                                    <th>สลิป</th>
                                    <th>สถานะ</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map(payment => {
                                    const shop = getShop(payment.shopId);
                                    return (
                                        <tr key={payment.id}>
                                            <td className="text-sm">{formatDate(payment.paymentDate)}</td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {shop?.stallNumber}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{shop?.name}</p>
                                                        <p className="text-xs text-gray-500">{shop?.ownerName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-info">{PAYMENT_TYPE_LABELS[payment.type]}</span>
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
                                                    {getStatusIcon(payment.slipVerifyStatus)}
                                                    {getStatusBadge(payment.slipVerifyStatus)}
                                                </div>
                                            </td>
                                            <td>
                                                {payment.slipVerifyStatus === 'pending' && payment.slipImageUrl && (
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
                                    );
                                })}
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

            {/* Add Payment Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`บันทึกการชำระเงิน - ${selectedShop?.name}`}
                size="lg"
                footer={
                    <>
                        <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleAddPayment}
                            className="btn btn-primary"
                            disabled={!addFormData.slipImageUrl}
                        >
                            บันทึก
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">ประเภท</label>
                            <select
                                value={addFormData.type}
                                onChange={e => setAddFormData({ ...addFormData, type: e.target.value as 'rent' | 'utilities' | 'other' })}
                                className="select"
                            >
                                <option value="utilities">ค่าสาธารณูปโภค</option>
                                <option value="rent">ค่าเช่า</option>
                                <option value="other">อื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">จำนวนเงิน</label>
                            <input
                                type="number"
                                value={addFormData.amount}
                                onChange={e => setAddFormData({ ...addFormData, amount: parseInt(e.target.value) })}
                                className="input"
                                min={0}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">รายละเอียด</label>
                        <input
                            type="text"
                            value={addFormData.description}
                            onChange={e => setAddFormData({ ...addFormData, description: e.target.value })}
                            className="input"
                        />
                    </div>

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
                            onClick={() => handleVerify('rejected', 'สลิปไม่ถูกต้อง')}
                            className="btn btn-danger"
                        >
                            <XCircle size={16} />
                            ไม่ผ่าน
                        </button>
                        <button
                            onClick={() => handleVerify('verified')}
                            className="btn btn-success"
                        >
                            <CheckCircle size={16} />
                            ยืนยัน
                        </button>
                    </>
                }
            >
                {selectedPayment && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-medium">{getShop(selectedPayment.shopId)?.name}</p>
                                <p className="text-sm text-gray-500">{selectedPayment.description}</p>
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
                                <p className="font-medium">{getShop(selectedPayment.shopId)?.name}</p>
                                <p className="text-sm text-gray-500">{formatDate(selectedPayment.paymentDate)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                                {getStatusBadge(selectedPayment.slipVerifyStatus)}
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

                        {selectedPayment.slipVerifyNote && (
                            <div className="p-4 bg-red-50 rounded-xl">
                                <p className="text-red-700 text-sm"><strong>หมายเหตุ:</strong> {selectedPayment.slipVerifyNote}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
