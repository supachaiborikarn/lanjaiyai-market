'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    Download,
    Calendar,
    DollarSign,
    Store,
    AlertCircle,
    Zap,
    Droplets,
    TrendingUp,
    BarChart3,
    FileSpreadsheet
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
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { getShops, getPayments, getMeterReadings, getInvoices } from '@/lib/storage-supabase';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { THAI_MONTH_NAMES } from '@/lib/constants';
import { Shop, Payment, MeterReading, Invoice } from '@/types';
import { PageLoading } from '@/components/ui/LoadingSpinner';

type ReportType = 'income' | 'pending' | 'utilities' | 'invoices';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [meters, setMeters] = useState<MeterReading[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState<ReportType>('income');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [shopsData, paymentsData, metersData, invoicesData] = await Promise.all([
                    getShops(),
                    getPayments(),
                    getMeterReadings(),
                    getInvoices()
                ]);
                setShops(shopsData);
                setPayments(paymentsData);
                setMeters(metersData);
                setInvoices(invoicesData);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getShop = (shopId: string) => shops.find(s => s.id === shopId);

    // Generate months for the year
    const months = Array.from({ length: 12 }, (_, i) => {
        return {
            key: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
            name: THAI_MONTH_NAMES[i],
            fullName: new Date(selectedYear, i, 1).toLocaleDateString('th-TH', { month: 'long' })
        };
    });

    // Calculate monthly income (from both payments and paid invoices)
    const getMonthlyIncome = (month: string) => {
        // Income from old payments table (verified slips)
        const paymentIncome = payments
            .filter(p => p.paymentDate.startsWith(month) && p.slipVerifyStatus === 'verified')
            .reduce((sum, p) => sum + p.amount, 0);

        // Income from paid invoices (includes manual clearing and verified invoice payments)
        const invoiceIncome = invoices
            .filter(i => i.status === 'paid' && i.paidAt && i.paidAt.startsWith(month))
            .reduce((sum, i) => sum + i.totalAmount, 0);

        return paymentIncome + invoiceIncome;
    };

    // Calculate monthly utilities
    const getMonthlyUtilities = (month: string) => {
        const monthMeters = meters.filter(m => m.month === month);
        const totalElectricity = monthMeters.reduce((sum, m) => sum + m.electricityCost, 0);
        const totalWater = monthMeters.reduce((sum, m) => sum + m.waterCost, 0);
        const totalUnits = monthMeters.reduce((sum, m) => sum + m.unitsUsed, 0);
        return { electricity: totalElectricity, water: totalWater, total: totalElectricity + totalWater, units: totalUnits };
    };

    // Calculate yearly totals
    const yearlyIncome = months.reduce((sum, m) => sum + getMonthlyIncome(m.key), 0);
    const expectedMonthlyRent = shops.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyRent, 0);
    const yearlyUtilities = months.reduce((sum, m) => sum + getMonthlyUtilities(m.key).total, 0);

    // Get pending payments
    const getPendingPayments = () => {
        const pending: { shop: Shop; type: string; amount: number; month?: string }[] = [];

        shops.filter(s => s.status === 'active').forEach(shop => {
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

    // Chart data
    const incomeChartData = months.map(m => ({
        month: m.name,
        income: getMonthlyIncome(m.key),
        target: expectedMonthlyRent
    }));

    const utilitiesChartData = months.map(m => {
        const utils = getMonthlyUtilities(m.key);
        return {
            month: m.name,
            electricity: utils.electricity,
            water: utils.water,
            units: utils.units
        };
    });

    // Invoice status data for pie chart
    const invoiceStatusData = [
        { name: 'ชำระแล้ว', value: invoices.filter(i => i.status === 'paid').length, color: '#22c55e' },
        { name: 'รอชำระ', value: invoices.filter(i => ['sent', 'pending_verification'].includes(i.status)).length, color: '#f59e0b' },
        { name: 'เกินกำหนด', value: invoices.filter(i => i.status === 'overdue').length, color: '#ef4444' },
        { name: 'ฉบับร่าง', value: invoices.filter(i => i.status === 'draft').length, color: '#94a3b8' }
    ].filter(d => d.value > 0);

    const handleExport = () => {
        let csvContent = '';

        if (reportType === 'income') {
            csvContent = 'เดือน,รายได้,เป้าหมาย,เปอร์เซ็นต์\n';
            months.forEach(m => {
                const income = getMonthlyIncome(m.key);
                const pct = expectedMonthlyRent > 0 ? Math.round((income / expectedMonthlyRent) * 100) : 0;
                csvContent += `${m.fullName},${income},${expectedMonthlyRent},${pct}%\n`;
            });
            csvContent += `รวมทั้งปี,${yearlyIncome},${expectedMonthlyRent * 12},${Math.round((yearlyIncome / (expectedMonthlyRent * 12)) * 100) || 0}%\n`;
        } else if (reportType === 'pending') {
            csvContent = 'ร้านค้า,ประเภท,เดือน,จำนวนเงิน\n';
            getPendingPayments().forEach(p => {
                csvContent += `${p.shop.name},${p.type},${p.month || '-'},${p.amount}\n`;
            });
        } else if (reportType === 'utilities') {
            csvContent = 'เดือน,ค่าไฟ,ค่าน้ำ,รวม,หน่วยไฟฟ้า\n';
            months.forEach(m => {
                const utils = getMonthlyUtilities(m.key);
                csvContent += `${m.fullName},${utils.electricity},${utils.water},${utils.total},${utils.units}\n`;
            });
            csvContent += `รวมทั้งปี,${months.reduce((s, m) => s + getMonthlyUtilities(m.key).electricity, 0)},${months.reduce((s, m) => s + getMonthlyUtilities(m.key).water, 0)},${yearlyUtilities},${months.reduce((s, m) => s + getMonthlyUtilities(m.key).units, 0)}\n`;
        } else if (reportType === 'invoices') {
            csvContent = 'เลขที่,ร้านค้า,เดือน,ยอดรวม,สถานะ,วันครบกำหนด\n';
            invoices.forEach(inv => {
                const shop = getShop(inv.shopId);
                csvContent += `${inv.invoiceNumber},${shop?.name || '-'},${inv.month},${inv.totalAmount},${inv.status},${inv.dueDate}\n`;
            });
        }

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report_${reportType}_${selectedYear}.csv`;
        link.click();
    };

    if (loading) {
        return <PageLoading />;
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header flex-col sm:flex-row gap-4">
                <div>
                    <h1 className="page-title">รายงาน</h1>
                    <p className="text-gray-500 mt-1">สรุปรายได้ ยอดค้างชำระ และค่าสาธารณูปโภค</p>
                </div>
                <button onClick={handleExport} className="btn btn-success">
                    <FileSpreadsheet size={18} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="select w-auto"
                >
                    {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year + 543}</option>
                    ))}
                </select>
                <div className="flex flex-wrap gap-2">
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
                    <button
                        onClick={() => setReportType('utilities')}
                        className={`btn ${reportType === 'utilities' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <Zap size={16} />
                        ค่าสาธารณูปโภค
                    </button>
                    <button
                        onClick={() => setReportType('invoices')}
                        className={`btn ${reportType === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <FileText size={16} />
                        ใบวางบิล
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">{formatCurrency(yearlyIncome)}</p>
                            <p className="text-xs text-gray-500">รายได้รวมทั้งปี</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Store size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">{formatCurrency(expectedMonthlyRent)}</p>
                            <p className="text-xs text-gray-500">ค่าเช่าคาดหวัง/เดือน</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Zap size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">{formatCurrency(yearlyUtilities)}</p>
                            <p className="text-xs text-gray-500">ค่าสาธารณูปโภคทั้งปี</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertCircle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">{formatCurrency(totalPending)}</p>
                            <p className="text-xs text-gray-500">ยอดค้างชำระ</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {reportType === 'income' && (
                <div className="space-y-6">
                    {/* Income Chart */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-600" />
                            กราฟรายได้รายเดือน
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={incomeChartData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${(v / 1000)}k`} />
                                    <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), '']} />
                                    <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} fill="url(#colorIncome)" name="รายได้" />
                                    <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" fill="none" name="เป้าหมาย" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Income Table */}
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
                                            <td className="font-medium">{month.fullName}</td>
                                            <td className="text-right font-semibold text-green-600">{formatCurrency(income)}</td>
                                            <td className="text-right text-gray-500">{formatCurrency(expectedMonthlyRent)}</td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium w-10">{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-50">
                                    <td className="font-bold">รวมทั้งปี</td>
                                    <td className="text-right font-bold text-green-600">{formatCurrency(yearlyIncome)}</td>
                                    <td className="text-right font-bold text-gray-500">{formatCurrency(expectedMonthlyRent * 12)}</td>
                                    <td className="text-right font-bold">{Math.round((yearlyIncome / (expectedMonthlyRent * 12)) * 100) || 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reportType === 'utilities' && (
                <div className="space-y-6">
                    {/* Utilities Chart */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-yellow-600" />
                            กราฟค่าสาธารณูปโภครายเดือน
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={utilitiesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${(v / 1000)}k`} />
                                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value) || 0), name === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ']} />
                                    <Legend formatter={(value) => value === 'electricity' ? 'ค่าไฟฟ้า' : 'ค่าน้ำประปา'} />
                                    <Bar dataKey="electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} name="electricity" />
                                    <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} name="water" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Utilities Table */}
                    <div className="card overflow-hidden">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>เดือน</th>
                                    <th className="text-right">หน่วยไฟฟ้า</th>
                                    <th className="text-right">ค่าไฟฟ้า</th>
                                    <th className="text-right">ค่าน้ำ</th>
                                    <th className="text-right">รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {months.map(month => {
                                    const utils = getMonthlyUtilities(month.key);
                                    return (
                                        <tr key={month.key}>
                                            <td className="font-medium">{month.fullName}</td>
                                            <td className="text-right">{utils.units.toLocaleString()} หน่วย</td>
                                            <td className="text-right text-yellow-600">{formatCurrency(utils.electricity)}</td>
                                            <td className="text-right text-blue-600">{formatCurrency(utils.water)}</td>
                                            <td className="text-right font-semibold">{formatCurrency(utils.total)}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-50">
                                    <td className="font-bold">รวมทั้งปี</td>
                                    <td className="text-right font-bold">{months.reduce((s, m) => s + getMonthlyUtilities(m.key).units, 0).toLocaleString()} หน่วย</td>
                                    <td className="text-right font-bold text-yellow-600">{formatCurrency(months.reduce((s, m) => s + getMonthlyUtilities(m.key).electricity, 0))}</td>
                                    <td className="text-right font-bold text-blue-600">{formatCurrency(months.reduce((s, m) => s + getMonthlyUtilities(m.key).water, 0))}</td>
                                    <td className="text-right font-bold">{formatCurrency(yearlyUtilities)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reportType === 'pending' && (
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
                                        <td className="text-right font-semibold text-red-600">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
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

            {reportType === 'invoices' && (
                <div className="space-y-6">
                    {/* Invoice Status Pie Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-purple-600" />
                                สถานะใบวางบิล
                            </h3>
                            <div className="h-64">
                                {invoiceStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={invoiceStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {invoiceStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        ยังไม่มีใบวางบิล
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-lg font-semibold mb-4">สรุปใบวางบิล</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="text-green-700">ชำระแล้ว</span>
                                    <span className="font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length} ใบ</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                    <span className="text-yellow-700">รอชำระ</span>
                                    <span className="font-bold text-yellow-600">{invoices.filter(i => ['sent', 'pending_verification'].includes(i.status)).length} ใบ</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                    <span className="text-red-700">เกินกำหนด</span>
                                    <span className="font-bold text-red-600">{invoices.filter(i => i.status === 'overdue').length} ใบ</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">ฉบับร่าง</span>
                                    <span className="font-bold text-gray-600">{invoices.filter(i => i.status === 'draft').length} ใบ</span>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center font-bold">
                                        <span>รวมทั้งหมด</span>
                                        <span>{invoices.length} ใบ</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                                        <span>มูลค่ารวม</span>
                                        <span>{formatCurrency(invoices.reduce((s, i) => s + i.totalAmount, 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Invoices Table */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold">ใบวางบิลล่าสุด</h3>
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>เลขที่</th>
                                    <th>ร้านค้า</th>
                                    <th>เดือน</th>
                                    <th className="text-right">ยอดรวม</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.slice(0, 10).map(inv => {
                                    const shop = getShop(inv.shopId);
                                    const statusColors: Record<string, string> = {
                                        paid: 'badge-success',
                                        sent: 'badge-info',
                                        pending_verification: 'badge-warning',
                                        overdue: 'badge-danger',
                                        draft: 'badge-secondary'
                                    };
                                    return (
                                        <tr key={inv.id}>
                                            <td className="font-medium">{inv.invoiceNumber}</td>
                                            <td>{shop?.name || '-'}</td>
                                            <td>{inv.month}</td>
                                            <td className="text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                                            <td>
                                                <span className={`badge ${statusColors[inv.status] || 'badge-secondary'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
