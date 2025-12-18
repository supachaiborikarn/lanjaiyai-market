'use client';

import { useEffect, useState } from 'react';
import {
    CreditCard,
    CheckCircle,
    AlertCircle,
    Clock,
    Plus,
    Zap,
    Droplets
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { SlipUploader } from '@/components/ui/SlipUploader';
import { showToast } from '@/components/ui/Toast';
import {
    getCurrentUser,
    getShopById,
    getMeterReadings,
    getPayments,
    addPayment,
    updateMeterReading
} from '@/lib/storage';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { User, Shop, MeterReading, Payment, SlipAnalysisResult, PAYMENT_TYPE_LABELS } from '@/types';

export default function ShopPaymentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMeter, setSelectedMeter] = useState<MeterReading | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        type: 'utilities' as 'rent' | 'utilities' | 'other',
        amount: 0,
        description: '',
        slipImageUrl: ''
    });

    useEffect(() => {
        loadData();
    }, [router]);

    const loadData = () => {
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
                setMeters(getMeterReadings().filter(m => m.shopId === shopData.id));
                setPayments(getPayments().filter(p => p.shopId === shopData.id).sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
            }
        }
    };

    const pendingMeters = meters.filter(m => m.status === 'pending');

    const openPaymentModal = (meter: MeterReading) => {
        setSelectedMeter(meter);
        setFormData({
            type: 'utilities',
            amount: meter.totalCost,
            description: `ค่าสาธารณูปโภค ${getMonthName(meter.month)}`,
            slipImageUrl: ''
        });
        setIsModalOpen(true);
    };

    const handleSlipAnalyzed = (imageUrl: string, result: SlipAnalysisResult) => {
        setFormData(prev => ({
            ...prev,
            slipImageUrl: imageUrl
        }));
    };

    const handleSubmitPayment = () => {
        if (!shop || !formData.slipImageUrl) return;

        addPayment({
            shopId: shop.id,
            meterReadingId: selectedMeter?.id,
            paymentDate: new Date().toISOString(),
            amount: formData.amount,
            type: formData.type,
            description: formData.description,
            slipImageUrl: formData.slipImageUrl,
            slipVerifyStatus: 'pending'
        });

        // Mark meter as paid if utilities
        if (selectedMeter) {
            updateMeterReading(selectedMeter.id, { status: 'paid' });
        }

        showToast('ส่งสลิปการชำระเงินเรียบร้อย รอการตรวจสอบ', 'success');
        loadData();
        setIsModalOpen(false);
        setSelectedMeter(null);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle size={20} className="text-green-600" />;
            case 'rejected':
                return <AlertCircle size={20} className="text-red-600" />;
            default:
                return <Clock size={20} className="text-yellow-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const classes = {
            pending: 'badge-warning',
            verified: 'badge-success',
            rejected: 'badge-danger'
        };
        const labels = {
            pending: 'รอตรวจสอบ',
            verified: 'ผ่านแล้ว',
            rejected: 'ไม่ผ่าน'
        };
        return <span className={`badge ${classes[status as keyof typeof classes]}`}>{labels[status as keyof typeof labels]}</span>;
    };

    if (!shop) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">ชำระเงิน</h1>
                    <p className="text-gray-500 mt-1">{shop.name}</p>
                </div>
            </div>

            {/* Pending Utilities */}
            {pendingMeters.length > 0 && (
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-yellow-600" />
                        ยอดค้างชำระ
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingMeters.map(meter => (
                            <div key={meter.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold">{getMonthName(meter.month)}</h3>
                                    <span className="badge badge-warning">รอชำระ</span>
                                </div>
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-gray-600">
                                            <Zap size={14} className="text-yellow-500" />
                                            ค่าไฟ ({meter.unitsUsed} หน่วย)
                                        </span>
                                        <span>{formatCurrency(meter.electricityCost)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-gray-600">
                                            <Droplets size={14} className="text-cyan-500" />
                                            ค่าน้ำ
                                        </span>
                                        <span>{formatCurrency(meter.waterCost)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t font-bold">
                                        <span>รวม</span>
                                        <span className="text-green-600">{formatCurrency(meter.totalCost)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openPaymentModal(meter)}
                                    className="btn btn-primary w-full"
                                >
                                    <Plus size={16} />
                                    แนบสลิปชำระเงิน
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {pendingMeters.length === 0 && (
                <div className="card p-8 mb-6 text-center">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                    <p className="text-lg font-medium text-gray-700">ไม่มียอดค้างชำระ</p>
                    <p className="text-gray-500">คุณชำระเงินครบถ้วนแล้ว</p>
                </div>
            )}

            {/* Payment History */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">ประวัติการชำระเงิน</h2>
                </div>
                {payments.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>วันที่</th>
                                <th>รายละเอียด</th>
                                <th>ประเภท</th>
                                <th>จำนวนเงิน</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(payment => (
                                <tr key={payment.id}>
                                    <td className="text-sm">{formatDate(payment.paymentDate)}</td>
                                    <td>{payment.description}</td>
                                    <td>
                                        <span className="badge badge-info text-xs">
                                            {PAYMENT_TYPE_LABELS[payment.type]}
                                        </span>
                                    </td>
                                    <td className="font-semibold">{formatCurrency(payment.amount)}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(payment.slipVerifyStatus)}
                                            {getStatusBadge(payment.slipVerifyStatus)}
                                        </div>
                                        {payment.slipVerifyNote && (
                                            <p className="text-xs text-red-500 mt-1">{payment.slipVerifyNote}</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                        <p>ยังไม่มีประวัติการชำระเงิน</p>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedMeter(null); }}
                title="แนบสลิปการชำระเงิน"
                size="lg"
                footer={
                    <>
                        <button onClick={() => { setIsModalOpen(false); setSelectedMeter(null); }} className="btn btn-secondary">
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSubmitPayment}
                            className="btn btn-primary"
                            disabled={!formData.slipImageUrl}
                        >
                            ส่งสลิป
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {selectedMeter && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">{getMonthName(selectedMeter.month)}</span>
                                <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(selectedMeter.totalCost)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                ค่าไฟ {formatCurrency(selectedMeter.electricityCost)} + ค่าน้ำ {formatCurrency(selectedMeter.waterCost)}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">แนบสลิปการโอนเงิน *</label>
                        <SlipUploader
                            onSlipAnalyzed={handleSlipAnalyzed}
                            expectedAmount={formData.amount}
                        />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                        <p className="font-medium mb-1">📝 หมายเหตุ</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-600">
                            <li>กรุณาถ่ายสลิปให้ชัดเจน เห็นวันที่และจำนวนเงินครบถ้วน</li>
                            <li>รอการตรวจสอบจากผู้ดูแลตลาด 1-2 วันทำการ</li>
                            <li>หากสลิปไม่ผ่านจะมีการแจ้งเหตุผลให้ทราบ</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
