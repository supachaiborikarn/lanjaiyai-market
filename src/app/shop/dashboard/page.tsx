'use client';

import { useEffect, useState } from 'react';
import {
    Store,
    Phone,
    Calendar,
    CreditCard,
    Zap,
    Droplets,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getShopById, getMeterReadings, getPayments } from '@/lib/storage';
import { formatCurrency, formatDate, getCurrentMonth, getMonthName, isContractExpiringSoon, getDaysUntilExpiry } from '@/lib/utils';
import { User, Shop, MeterReading, Payment, SHOP_STATUS_LABELS } from '@/types';
import Link from 'next/link';

export default function ShopDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

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
                setMeters(getMeterReadings().filter(m => m.shopId === shopData.id));
                setPayments(getPayments().filter(p => p.shopId === shopData.id));
            }
        }
    }, [router]);

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

    const currentMonth = getCurrentMonth();
    const currentMonthMeter = meters.find(m => m.month === currentMonth);
    const pendingPayments = meters.filter(m => m.status === 'pending');
    const totalPending = pendingPayments.reduce((sum, m) => sum + m.totalCost, 0);
    const recentPayments = payments.slice(0, 5);

    return (
        <div className="animate-fadeIn">
            {/* Welcome Banner */}
            <div className="card p-6 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold">
                        {shop.stallNumber}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">สวัสดี, {shop.ownerName}</h1>
                        <p className="text-white/80">{shop.name}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CreditCard size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(shop.monthlyRent)}</p>
                            <p className="text-sm text-gray-500">ค่าเช่า/เดือน</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${totalPending > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
                            {totalPending > 0 ? (
                                <AlertCircle size={24} className="text-red-600" />
                            ) : (
                                <CheckCircle size={24} className="text-green-600" />
                            )}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                            <p className="text-sm text-gray-500">ยอดค้างชำระ</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${isContractExpiringSoon(shop.contractEnd) ? 'bg-yellow-100' : 'bg-blue-100'} flex items-center justify-center`}>
                            <Calendar size={24} className={isContractExpiringSoon(shop.contractEnd) ? 'text-yellow-600' : 'text-blue-600'} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{getDaysUntilExpiry(shop.contractEnd)}</p>
                            <p className="text-sm text-gray-500">วันจนหมดสัญญา</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Info & Current Month Utilities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Shop Info */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Store size={20} />
                        ข้อมูลร้านค้า
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Store size={18} className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">ประเภท</p>
                                <p className="font-medium">{shop.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Phone size={18} className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">เบอร์ติดต่อ</p>
                                <p className="font-medium">{shop.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Calendar size={18} className="text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">สัญญาเช่า</p>
                                <p className="font-medium">
                                    {formatDate(shop.contractStart)} - {formatDate(shop.contractEnd)}
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">สถานะ</p>
                            <span className={`badge ${shop.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                {SHOP_STATUS_LABELS[shop.status]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Current Month Utilities */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap size={20} />
                        ค่าสาธารณูปโภค {getMonthName(currentMonth)}
                    </h2>
                    {currentMonthMeter ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Zap size={18} className="text-yellow-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">ค่าไฟฟ้า</p>
                                        <p className="text-xs text-gray-400">{currentMonthMeter.unitsUsed} หน่วย × 5 บาท</p>
                                    </div>
                                </div>
                                <p className="font-semibold">{formatCurrency(currentMonthMeter.electricityCost)}</p>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Droplets size={18} className="text-cyan-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">ค่าน้ำประปา</p>
                                        <p className="text-xs text-gray-400">เหมาจ่าย</p>
                                    </div>
                                </div>
                                <p className="font-semibold">{formatCurrency(currentMonthMeter.waterCost)}</p>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                                <span className="font-medium">รวมทั้งหมด</span>
                                <span className="text-2xl font-bold">{formatCurrency(currentMonthMeter.totalCost)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`badge ${currentMonthMeter.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                    {currentMonthMeter.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                                </span>
                                {currentMonthMeter.status === 'pending' && (
                                    <Link href="/shop/payments" className="btn btn-primary">
                                        ชำระเงิน
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Zap size={40} className="mx-auto mb-2 opacity-50" />
                            <p>ยังไม่มีการจดมิเตอร์เดือนนี้</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Payments */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">ประวัติการชำระเงิน</h2>
                    <Link href="/shop/payments" className="text-blue-600 hover:underline text-sm">
                        ดูทั้งหมด →
                    </Link>
                </div>
                {recentPayments.length > 0 ? (
                    <div className="space-y-3">
                        {recentPayments.map(payment => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    {payment.slipVerifyStatus === 'verified' ? (
                                        <CheckCircle size={20} className="text-green-600" />
                                    ) : payment.slipVerifyStatus === 'rejected' ? (
                                        <AlertCircle size={20} className="text-red-600" />
                                    ) : (
                                        <Clock size={20} className="text-yellow-600" />
                                    )}
                                    <div>
                                        <p className="font-medium">{payment.description}</p>
                                        <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                    <span className={`badge ${payment.slipVerifyStatus === 'verified' ? 'badge-success' :
                                            payment.slipVerifyStatus === 'rejected' ? 'badge-danger' : 'badge-warning'
                                        } text-xs`}>
                                        {payment.slipVerifyStatus === 'verified' ? 'ผ่าน' :
                                            payment.slipVerifyStatus === 'rejected' ? 'ไม่ผ่าน' : 'รอตรวจ'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <CreditCard size={40} className="mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีประวัติการชำระเงิน</p>
                    </div>
                )}
            </div>
        </div>
    );
}
