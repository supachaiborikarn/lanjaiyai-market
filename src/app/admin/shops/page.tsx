'use client';

import { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Store,
    Phone,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { getShops, addShop, updateShop, deleteShop } from '@/lib/storage';
import { formatCurrency, formatDate, formatDateInput, isContractExpiringSoon, getDaysUntilExpiry, isContractExpired } from '@/lib/utils';
import { Shop, SHOP_CATEGORIES, SHOP_STATUS_LABELS, ShopStatus } from '@/types';

export default function ShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        phone: '',
        category: SHOP_CATEGORIES[0],
        stallNumber: 1,
        status: 'active' as ShopStatus,
        contractStart: '',
        contractEnd: '',
        monthlyRent: 3000
    });

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = () => {
        setShops(getShops());
    };

    const filteredShops = shops.filter(shop => {
        const matchesSearch =
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || shop.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const openAddModal = () => {
        setEditingShop(null);
        setFormData({
            name: '',
            ownerName: '',
            phone: '',
            category: SHOP_CATEGORIES[0],
            stallNumber: shops.length + 1,
            status: 'active',
            contractStart: new Date().toISOString(),
            contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            monthlyRent: 3000
        });
        setIsModalOpen(true);
    };

    const openEditModal = (shop: Shop) => {
        setEditingShop(shop);
        setFormData({
            name: shop.name,
            ownerName: shop.ownerName,
            phone: shop.phone,
            category: shop.category,
            stallNumber: shop.stallNumber,
            status: shop.status,
            contractStart: shop.contractStart,
            contractEnd: shop.contractEnd,
            monthlyRent: shop.monthlyRent
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingShop) {
            updateShop(editingShop.id, formData);
            showToast('อัปเดตข้อมูลร้านค้าเรียบร้อย', 'success');
        } else {
            addShop(formData);
            showToast('เพิ่มร้านค้าใหม่เรียบร้อย', 'success');
        }

        loadShops();
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (shopToDelete) {
            deleteShop(shopToDelete.id);
            showToast('ลบร้านค้าเรียบร้อย', 'success');
            loadShops();
            setIsDeleteModalOpen(false);
            setShopToDelete(null);
        }
    };

    const getStatusBadge = (status: ShopStatus) => {
        const classes = {
            active: 'badge-success',
            inactive: 'badge-warning',
            suspended: 'badge-danger'
        };
        return <span className={`badge ${classes[status]}`}>{SHOP_STATUS_LABELS[status]}</span>;
    };

    const getContractBadge = (shop: Shop) => {
        if (isContractExpired(shop.contractEnd)) {
            return <span className="badge badge-danger">หมดอายุแล้ว</span>;
        }
        if (isContractExpiringSoon(shop.contractEnd, 30)) {
            return <span className="badge badge-warning">เหลือ {getDaysUntilExpiry(shop.contractEnd)} วัน</span>;
        }
        return null;
    };

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">จัดการร้านค้า</h1>
                    <p className="text-gray-500 mt-1">ทั้งหมด {shops.length} ร้าน</p>
                </div>
                <button onClick={openAddModal} className="btn btn-primary">
                    <Plus size={18} />
                    เพิ่มร้านค้า
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อร้านหรือเจ้าของ..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input pl-11"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="select w-auto"
                >
                    <option value="all">ทุกสถานะ</option>
                    <option value="active">เปิดใช้งาน</option>
                    <option value="inactive">ปิดชั่วคราว</option>
                    <option value="suspended">ยกเลิก</option>
                </select>
            </div>

            {/* Shops Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShops.map(shop => (
                    <div key={shop.id} className="card p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {shop.stallNumber}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{shop.name}</h3>
                                    <p className="text-sm text-gray-500">{shop.ownerName}</p>
                                </div>
                            </div>
                            {getStatusBadge(shop.status)}
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={16} className="text-gray-400" />
                                {shop.phone}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Store size={16} className="text-gray-400" />
                                {shop.category}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={16} className="text-gray-400" />
                                <span>
                                    สัญญา: {formatDate(shop.contractStart)} - {formatDate(shop.contractEnd)}
                                </span>
                            </div>
                        </div>

                        {getContractBadge(shop) && (
                            <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 rounded-lg">
                                <AlertCircle size={16} className="text-yellow-600" />
                                {getContractBadge(shop)}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-lg font-bold text-gray-800">
                                {formatCurrency(shop.monthlyRent)}
                                <span className="text-sm font-normal text-gray-500">/เดือน</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(shop)}
                                    className="btn btn-secondary p-2"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => { setShopToDelete(shop); setIsDeleteModalOpen(true); }}
                                    className="btn btn-danger p-2"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredShops.length === 0 && (
                <div className="text-center py-16 card">
                    <Store size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">ไม่พบร้านค้า</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingShop ? 'แก้ไขข้อมูลร้านค้า' : 'เพิ่มร้านค้าใหม่'}
                size="lg"
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                            ยกเลิก
                        </button>
                        <button onClick={handleSubmit} className="btn btn-primary">
                            {editingShop ? 'บันทึก' : 'เพิ่มร้านค้า'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label className="label">ชื่อร้าน *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">หมายเลขแผง *</label>
                        <input
                            type="number"
                            value={formData.stallNumber}
                            onChange={e => setFormData({ ...formData, stallNumber: parseInt(e.target.value) })}
                            className="input"
                            min={1}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">ชื่อเจ้าของ *</label>
                        <input
                            type="text"
                            value={formData.ownerName}
                            onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">เบอร์โทรศัพท์ *</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">ประเภท</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="select"
                        >
                            {SHOP_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">สถานะ</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as ShopStatus })}
                            className="select"
                        >
                            <option value="active">เปิดใช้งาน</option>
                            <option value="inactive">ปิดชั่วคราว</option>
                            <option value="suspended">ยกเลิก</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">วันเริ่มสัญญา</label>
                        <input
                            type="date"
                            value={formatDateInput(formData.contractStart)}
                            onChange={e => setFormData({ ...formData, contractStart: new Date(e.target.value).toISOString() })}
                            className="input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">วันสิ้นสุดสัญญา</label>
                        <input
                            type="date"
                            value={formatDateInput(formData.contractEnd)}
                            onChange={e => setFormData({ ...formData, contractEnd: new Date(e.target.value).toISOString() })}
                            className="input"
                        />
                    </div>
                    <div className="form-group full-width">
                        <label className="label">ค่าเช่า/เดือน (บาท) *</label>
                        <input
                            type="number"
                            value={formData.monthlyRent}
                            onChange={e => setFormData({ ...formData, monthlyRent: parseInt(e.target.value) })}
                            className="input"
                            min={0}
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="ยืนยันการลบ"
                size="sm"
                footer={
                    <>
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
                            ยกเลิก
                        </button>
                        <button onClick={handleDelete} className="btn btn-danger">
                            ลบร้านค้า
                        </button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <Trash2 size={32} className="text-red-600" />
                    </div>
                    <p className="text-gray-700">
                        คุณต้องการลบร้าน <strong>{shopToDelete?.name}</strong> หรือไม่?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">การลบจะไม่สามารถย้อนกลับได้</p>
                </div>
            </Modal>
        </div>
    );
}
