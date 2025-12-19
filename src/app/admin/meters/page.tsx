'use client';

import { useEffect, useState } from 'react';
import {
    Zap,
    Droplets,
    Save,
    Calculator,
    Store,
    Calendar,
    Check,
    Loader2
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import {
    getShops,
    getMeterReadings,
    getLatestMeterReading,
    addMeterReading,
    updateMeterReading
} from '@/lib/storage-supabase';
import { formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils';
import { Shop, MeterReading, ELECTRICITY_RATE, WATER_FLAT_RATE } from '@/types';

export default function MetersPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [readings, setReadings] = useState<MeterReading[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
    const [editingReadings, setEditingReadings] = useState<Record<string, { previous: number; current: number }>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allShops, allReadings] = await Promise.all([
                getShops(),
                getMeterReadings()
            ]);

            const activeShops = allShops.filter(s => s.status === 'active');
            setShops(activeShops);
            setReadings(allReadings);

            // Initialize editing readings
            const initial: Record<string, { previous: number; current: number }> = {};
            for (const shop of activeShops) {
                const latestReading = await getLatestMeterReading(shop.id);
                initial[shop.id] = {
                    previous: latestReading?.currentReading || 0,
                    current: latestReading?.currentReading || 0
                };
            }
            setEditingReadings(initial);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShopReading = (shopId: string, month: string): MeterReading | undefined => {
        return readings.find(r => r.shopId === shopId && r.month === month);
    };

    const calculateCost = (shopId: string) => {
        const reading = editingReadings[shopId];
        if (!reading) return { units: 0, electricity: 0, water: WATER_FLAT_RATE, total: WATER_FLAT_RATE };

        const units = Math.max(0, reading.current - reading.previous);
        const electricity = units * ELECTRICITY_RATE;
        const water = WATER_FLAT_RATE;
        const total = electricity + water;

        return { units, electricity, water, total };
    };

    const handleSaveReading = async (shop: Shop) => {
        const reading = editingReadings[shop.id];
        if (!reading) return;

        const costs = calculateCost(shop.id);
        const existingReading = getShopReading(shop.id, currentMonth);

        try {
            if (existingReading) {
                await updateMeterReading(existingReading.id, {
                    previousReading: reading.previous,
                    currentReading: reading.current,
                    unitsUsed: costs.units,
                    electricityCost: costs.electricity,
                    waterCost: costs.water,
                    totalCost: costs.total
                });
            } else {
                await addMeterReading({
                    shopId: shop.id,
                    readingDate: new Date().toISOString(),
                    month: currentMonth,
                    previousReading: reading.previous,
                    currentReading: reading.current,
                    unitsUsed: costs.units,
                    electricityCost: costs.electricity,
                    waterCost: costs.water,
                    totalCost: costs.total,
                    status: 'pending'
                });
            }
            showToast(`บันทึกมิเตอร์ ${shop.name} เรียบร้อย`, 'success');
            await loadData();
        } catch (error) {
            console.error('Error saving meter reading:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        }
    };

    const updateReading = (shopId: string, field: 'previous' | 'current', value: number) => {
        setEditingReadings(prev => ({
            ...prev,
            [shopId]: {
                ...prev[shopId],
                [field]: value
            }
        }));
    };

    const getTotalUtilities = () => {
        let totalElectricity = 0;
        let totalWater = 0;

        shops.forEach(shop => {
            const reading = getShopReading(shop.id, currentMonth);
            if (reading) {
                totalElectricity += reading.electricityCost;
                totalWater += reading.waterCost;
            }
        });

        return { totalElectricity, totalWater, total: totalElectricity + totalWater };
    };

    const totals = getTotalUtilities();
    const recordedCount = shops.filter(s => getShopReading(s.id, currentMonth)).length;

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">จดมิเตอร์</h1>
                    <p className="text-gray-500 mt-1">{getMonthName(currentMonth)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={currentMonth}
                        onChange={e => setCurrentMonth(e.target.value)}
                        className="input w-auto"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Store size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{recordedCount}/{shops.length}</p>
                            <p className="text-sm text-gray-500">ร้านบันทึกแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <Zap size={24} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totals.totalElectricity)}</p>
                            <p className="text-sm text-gray-500">ค่าไฟรวม</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                            <Droplets size={24} className="text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totals.totalWater)}</p>
                            <p className="text-sm text-gray-500">ค่าน้ำรวม</p>
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Calculator size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
                            <p className="text-sm text-gray-500">รวมทั้งหมด</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rate Info */}
            <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className="text-yellow-600" />
                        <span><strong>ค่าไฟ:</strong> {ELECTRICITY_RATE} บาท/หน่วย</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-cyan-600" />
                        <span><strong>ค่าน้ำ:</strong> {WATER_FLAT_RATE} บาท/เดือน (เหมาจ่าย)</span>
                    </div>
                </div>
            </div>

            {/* Meters List */}
            <div className="card overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>แผง</th>
                            <th>ร้านค้า</th>
                            <th>มิเตอร์ก่อนหน้า</th>
                            <th>มิเตอร์ปัจจุบัน</th>
                            <th>หน่วยใช้</th>
                            <th>ค่าไฟ</th>
                            <th>ค่าน้ำ</th>
                            <th>รวม</th>
                            <th>สถานะ</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {shops.map(shop => {
                            const savedReading = getShopReading(shop.id, currentMonth);
                            const currentValues = editingReadings[shop.id] || { previous: 0, current: 0 };
                            const costs = calculateCost(shop.id);

                            return (
                                <tr key={shop.id}>
                                    <td>
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {shop.stallNumber}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <p className="font-medium">{shop.name}</p>
                                            <p className="text-sm text-gray-500">{shop.ownerName}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={currentValues.previous}
                                            onChange={e => updateReading(shop.id, 'previous', parseInt(e.target.value) || 0)}
                                            className="input w-24 text-center"
                                            min={0}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={currentValues.current}
                                            onChange={e => updateReading(shop.id, 'current', parseInt(e.target.value) || 0)}
                                            className="input w-24 text-center"
                                            min={0}
                                        />
                                    </td>
                                    <td className="font-medium">{costs.units} หน่วย</td>
                                    <td>{formatCurrency(costs.electricity)}</td>
                                    <td>{formatCurrency(costs.water)}</td>
                                    <td className="font-bold text-green-600">{formatCurrency(costs.total)}</td>
                                    <td>
                                        {savedReading ? (
                                            <span className={`badge ${savedReading.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                                {savedReading.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                                            </span>
                                        ) : (
                                            <span className="badge badge-info">ยังไม่บันทึก</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleSaveReading(shop)}
                                            className="btn btn-primary p-2"
                                            title="บันทึก"
                                        >
                                            {savedReading ? <Check size={16} /> : <Save size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {shops.length === 0 && (
                <div className="text-center py-16 card">
                    <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">ไม่พบร้านค้าที่เปิดใช้งาน</p>
                </div>
            )}
        </div>
    );
}
