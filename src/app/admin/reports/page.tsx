'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    Download,
    Calendar,
    DollarSign,
    Store,
    AlertCircle
} from 'lucide-react';
import { getShops, getPayments, getMeterReadings } from '@/lib/storage-supabase';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { Shop, Payment, MeterReading } from '@/types';

export default function ReportsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState<'income' | 'pending' | 'utilities'>('income');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [shopsData, paymentsData, metersData] = await Promise.all([
                    getShops(),
                    getPayments(),
                    getMeterReadings()
                ]);
                setShops(shopsData);
                setPayments(paymentsData);
                setMeters(metersData);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    const getShop = (shopId: string) => shops.find(s => s.id === shopId);

    // Generate months for the year
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(selectedYear, i, 1);
        return {
            key: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
            name: date.toLocaleDateString('th-TH', { month: 'long' })
        };
    });

    // Calculate monthly income
    const getMonthlyIncome = (month: string) => {
        return payments
            .filter(p => p.paymentDate.startsWith(month) && p.slipVerifyStatus === 'verified')
            .reduce((sum, p) => sum + p.amount, 0);
    };

    // Calculate yearly totals
    const yearlyIncome = months.reduce((sum, m) => sum + getMonthlyIncome(m.key), 0);
    const expectedMonthlyRent = shops.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyRent, 0);

    // Get pending payments
    const getPendingPayments = () => {
        const pending: { shop: Shop; type: string; amount: number; month?: string }[] = [];

        shops.filter(s => s.status === 'active').forEach(shop => {
            // Check unpaid meters
            const unpaidMeters = meters.filter(m => m.shopId === shop.id && m.status === 'pending');
            unpaidMeters.forEach(meter => {
                pending.push({
                    shop,
                    type: 'ค่าสาธารณูปโภค',
                    amount: meter.totalCost,
                    month: getMonthName(meter.month)
                });
            });
        });

        return pending;
    };

    const totalPending = getPendingPayments().reduce((sum, p) => sum + p.amount, 0);

    const handleExport = () => {
        // Create CSV content
        let csvContent = '';

        if (reportType === 'income') {
            csvContent = 'เดือน,รายได้\n';
            months.forEach(m => {
                csvContent += `${m.name},${getMonthlyIncome(m.key)}\n`;
            });
            csvContent += `รวมทั้งปี,${yearlyIncome}\n`;
        } else if (reportType === 'pending') {
            csvContent = 'ร้านค้า,ประเภท,เดือน,จำนวนเงิน\n';
            getPendingPayments().forEach(p => {
                csvContent += `${p.shop.name},${p.type},${p.month || '-'},${p.amount}\n`;
            });
        }

        // Download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report_${reportType}_${selectedYear}.csv`;
        link.click();
    };

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">รายงาน</h1>
                    <p className="text-gray-500 mt-1">สรุปรายได้และยอดค้างชำระ</p>
                </div>
                <button onClick={handleExport} className="btn btn-primary">
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="select w-auto"
                >
                    {[2023, 2024, 2025].map(year => (
                        <option key={year} value={year}>{year + 543}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <button
                        onClick={() => setReportType('income')}
                        className={`btn ${reportType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <DollarSign size={16} />
                        รายได้
                    </button>
                    <button
                        onClick={() => setReportType('pending')}
                        className={`btn ${reportType === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <AlertCircle size={16} />
                        ค้างชำระ
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(yearlyIncome)}</p>
                            <p className="text-sm text-gray-500">รายได้รวมทั้งปี</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Store size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(expectedMonthlyRent)}</p>
                            <p className="text-sm text-gray-500">ค่าเช่าคาดหวัง/เดือน</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertCircle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                            <p className="text-sm text-gray-500">ยอดค้างชำระ</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {reportType === 'income' ? (
                <div className="card overflow-hidden">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>เดือน</th>
                                <th className="text-right">รายได้</th>
                                <th className="text-right">เป้าหมาย</th>
                                <th className="text-right">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {months.map(month => {
                                const income = getMonthlyIncome(month.key);
                                const percentage = expectedMonthlyRent > 0 ? Math.round((income / expectedMonthlyRent) * 100) : 0;

                                return (
                                    <tr key={month.key}>
                                        <td className="font-medium">{month.name}</td>
                                        <td className="text-right font-semibold text-green-600">
                                            {formatCurrency(income)}
                                        </td>
                                        <td className="text-right text-gray-500">
                                            {formatCurrency(expectedMonthlyRent)}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">{percentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gray-50">
                                <td className="font-bold">รวมทั้งปี</td>
                                <td className="text-right font-bold text-green-600">{formatCurrency(yearlyIncome)}</td>
                                <td className="text-right font-bold text-gray-500">{formatCurrency(expectedMonthlyRent * 12)}</td>
                                <td className="text-right font-bold">
                                    {Math.round((yearlyIncome / (expectedMonthlyRent * 12)) * 100) || 0}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ร้านค้า</th>
                                <th>ประเภท</th>
                                <th>เดือน</th>
                                <th className="text-right">จำนวนเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPendingPayments().length > 0 ? (
                                getPendingPayments().map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {item.shop.stallNumber}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{item.shop.name}</p>
                                                    <p className="text-xs text-gray-500">{item.shop.ownerName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.type}</td>
                                        <td>{item.month || '-'}</td>
                                        <td className="text-right font-semibold text-red-600">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        ไม่มียอดค้างชำระ
                                    </td>
                                </tr>
                            )}
                            {getPendingPayments().length > 0 && (
                                <tr className="bg-red-50">
                                    <td colSpan={3} className="font-bold">รวมยอดค้างชำระ</td>
                                    <td className="text-right font-bold text-red-600">{formatCurrency(totalPending)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
