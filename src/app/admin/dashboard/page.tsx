'use client';

import { useEffect, useState } from 'react';
import {
    Store,
    DollarSign,
    AlertCircle,
    FileImage,
    TrendingUp,
    Users,
    Zap,
    Calendar
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { getShops, getMeterReadings, getPayments, getStatistics } from '@/lib/storage';
import { formatCurrency, isContractExpiringSoon, getDaysUntilExpiry } from '@/lib/utils';
import { Shop, MeterReading, Payment } from '@/types';
import Link from 'next/link';

// Mock monthly revenue data
const revenueData = [
    { month: 'ก.ค.', revenue: 28500, count: 8 },
    { month: 'ส.ค.', revenue: 31200, count: 9 },
    { month: 'ก.ย.', revenue: 29800, count: 8 },
    { month: 'ต.ค.', revenue: 32500, count: 10 },
    { month: 'พ.ย.', revenue: 30000, count: 9 },
    { month: 'ธ.ค.', revenue: 33000, count: 10 },
];

export default function AdminDashboard() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState({
        totalShops: 0,
        activeShops: 0,
        totalRent: 0,
        totalPaid: 0,
        pendingSlips: 0,
        unpaidMeters: 0
    });

    useEffect(() => {
        setShops(getShops());
        setMeters(getMeterReadings());
        setPayments(getPayments());
        setStats(getStatistics());
    }, []);

    const expiringContracts = shops.filter(s => isContractExpiringSoon(s.contractEnd, 60));
    const pendingPayments = payments.filter(p => p.slipVerifyStatus === 'pending');

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="text-gray-500 mt-1">ภาพรวมตลาดลานใจใหญ่</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-icon bg-blue-100">
                        <Store size={24} className="text-blue-600" />
                    </div>
                    <div className="stat-value">{stats.totalShops}</div>
                    <div className="stat-label">ร้านค้าทั้งหมด</div>
                    <div className="mt-2 text-sm">
                        <span className="text-green-600 font-medium">{stats.activeShops} ร้าน</span>
                        <span className="text-gray-400 ml-1">เปิดใช้งาน</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon bg-green-100">
                        <DollarSign size={24} className="text-green-600" />
                    </div>
                    <div className="stat-value">{formatCurrency(stats.totalRent)}</div>
                    <div className="stat-label">รายได้ค่าเช่า/เดือน</div>
                    <div className="mt-2 text-sm">
                        <span className="text-green-600 font-medium flex items-center gap-1">
                            <TrendingUp size={14} /> +5.2%
                        </span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon bg-yellow-100">
                        <FileImage size={24} className="text-yellow-600" />
                    </div>
                    <div className="stat-value">{stats.pendingSlips}</div>
                    <div className="stat-label">สลิปรอตรวจสอบ</div>
                    <Link href="/admin/payments" className="mt-2 text-sm text-blue-600 hover:underline">
                        ดูรายละเอียด →
                    </Link>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon bg-red-100">
                        <AlertCircle size={24} className="text-red-600" />
                    </div>
                    <div className="stat-value">{expiringContracts.length}</div>
                    <div className="stat-label">สัญญาใกล้หมดอายุ</div>
                    <Link href="/admin/shops" className="mt-2 text-sm text-blue-600 hover:underline">
                        ดูรายละเอียด →
                    </Link>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Chart */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">รายได้รายเดือน</h2>
                        <span className="badge badge-success">+8.3% จากเดือนก่อน</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${(v / 1000)}k`} />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(Number(value) || 0), 'รายได้']}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Count Chart */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">จำนวนการชำระเงิน</h2>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    formatter={(value) => [Number(value) || 0, 'รายการ']}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Slips */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">สลิปรอตรวจสอบ</h2>
                        <Link href="/admin/payments" className="text-sm text-blue-600 hover:underline">
                            ดูทั้งหมด →
                        </Link>
                    </div>
                    {pendingPayments.length > 0 ? (
                        <div className="space-y-3">
                            {pendingPayments.slice(0, 5).map(payment => {
                                const shop = shops.find(s => s.id === payment.shopId);
                                return (
                                    <div key={payment.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                            <FileImage size={20} className="text-yellow-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{shop?.name || 'ไม่ทราบชื่อร้าน'}</p>
                                            <p className="text-gray-500 text-xs">
                                                {new Date(payment.createdAt).toLocaleDateString('th-TH')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                                            <span className="badge badge-warning text-xs">รอตรวจสอบ</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FileImage size={40} className="mx-auto mb-2 opacity-50" />
                            <p>ไม่มีสลิปรอตรวจสอบ</p>
                        </div>
                    )}
                </div>

                {/* Expiring Contracts */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">สัญญาใกล้หมดอายุ</h2>
                        <Link href="/admin/shops" className="text-sm text-blue-600 hover:underline">
                            ดูทั้งหมด →
                        </Link>
                    </div>
                    {expiringContracts.length > 0 ? (
                        <div className="space-y-3">
                            {expiringContracts.slice(0, 5).map(shop => {
                                const daysLeft = getDaysUntilExpiry(shop.contractEnd);
                                return (
                                    <div key={shop.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                            <Calendar size={20} className="text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{shop.name}</p>
                                            <p className="text-gray-500 text-xs">แผง {shop.stallNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold text-sm ${daysLeft <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {daysLeft} วัน
                                            </p>
                                            <span className={`badge ${daysLeft <= 30 ? 'badge-danger' : 'badge-warning'} text-xs`}>
                                                {daysLeft <= 30 ? 'ใกล้หมด' : 'เตือน'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar size={40} className="mx-auto mb-2 opacity-50" />
                            <p>ไม่มีสัญญาใกล้หมดอายุ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
