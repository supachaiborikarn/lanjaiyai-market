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
    Store,
    Calendar,
    Loader2,
    XCircle
} from 'lucide-react';
import {
    getShops,
    getContracts,
    addContract,
    sendContractForSignature
} from '@/lib/storage-supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Shop, Contract, ContractStatus, CONTRACT_STATUS_LABELS } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { SignaturePad } from '@/components/ui/SignaturePad';

export default function AdminContractsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form state
    const [formData, setFormData] = useState({
        shopId: '',
        startDate: '',
        endDate: '',
        monthlyRent: 0,
        depositAmount: 0,
        terms: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopsData, contractsData] = await Promise.all([
                getShops(),
                getContracts()
            ]);
            setShops(shopsData);
            setContracts(contractsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShop = (shopId: string) => shops.find(s => s.id === shopId);

    const filteredContracts = contracts.filter(c => {
        return filterStatus === 'all' || c.status === filterStatus;
    });

    const handleCreateContract = async () => {
        if (!formData.shopId || !formData.startDate || !formData.endDate) {
            showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await addContract({
                shopId: formData.shopId,
                startDate: formData.startDate,
                endDate: formData.endDate,
                monthlyRent: formData.monthlyRent,
                depositAmount: formData.depositAmount,
                terms: formData.terms,
                status: 'draft'
            });
            showToast('สร้างสัญญาสำเร็จ', 'success');
            setIsCreateModalOpen(false);
            resetForm();
            await loadData();
        } catch (error) {
            console.error('Error creating contract:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendForSignature = async (contract: Contract, signatureUrl?: string) => {
        setIsSubmitting(true);
        try {
            await sendContractForSignature(contract.id, signatureUrl);
            showToast('ส่งสัญญาให้ลูกค้าลงนามแล้ว', 'success');
            setIsSignatureModalOpen(false);
            setIsDetailModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error sending contract:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            shopId: '',
            startDate: '',
            endDate: '',
            monthlyRent: 0,
            depositAmount: 0,
            terms: ''
        });
    };

    const getStatusBadge = (status: ContractStatus) => {
        const classes: Record<ContractStatus, string> = {
            draft: 'badge-secondary',
            pending_signature: 'badge-warning',
            signed: 'badge-success',
            expired: 'badge-danger',
            cancelled: 'badge-secondary'
        };
        return <span className={`badge ${classes[status]}`}>{CONTRACT_STATUS_LABELS[status]}</span>;
    };

    const getStatusIcon = (status: ContractStatus) => {
        switch (status) {
            case 'signed': return <CheckCircle size={20} className="text-green-600" />;
            case 'pending_signature': return <Clock size={20} className="text-yellow-600" />;
            case 'expired': return <AlertCircle size={20} className="text-red-600" />;
            case 'cancelled': return <XCircle size={20} className="text-gray-600" />;
            default: return <FileText size={20} className="text-gray-400" />;
        }
    };

    // Stats
    const draftCount = contracts.filter(c => c.status === 'draft').length;
    const pendingCount = contracts.filter(c => c.status === 'pending_signature').length;
    const signedCount = contracts.filter(c => c.status === 'signed').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header flex-col lg:flex-row gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="page-title">สัญญาเช่า</h1>
                    <p className="text-gray-500 mt-1 text-sm hidden sm:block">จัดการสัญญาเช่าร้านค้า</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    สร้างสัญญาใหม่
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText size={20} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{draftCount}</p>
                            <p className="text-sm text-gray-500">ฉบับร่าง</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                            <p className="text-sm text-gray-500">รอลงนาม</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{signedCount}</p>
                            <p className="text-sm text-gray-500">ลงนามแล้ว</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="card p-4 mb-6">
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-field"
                    >
                        <option value="all">ทุกสถานะ</option>
                        <option value="draft">ฉบับร่าง</option>
                        <option value="pending_signature">รอลงนาม</option>
                        <option value="signed">ลงนามแล้ว</option>
                        <option value="expired">หมดอายุ</option>
                        <option value="cancelled">ยกเลิก</option>
                    </select>
                </div>
            </div>

            {/* Contracts List */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th className="whitespace-nowrap">เลขที่สัญญา</th>
                                <th className="whitespace-nowrap">ร้านค้า</th>
                                <th className="whitespace-nowrap">ค่าเช่า/เดือน</th>
                                <th className="whitespace-nowrap">ระยะเวลา</th>
                                <th className="whitespace-nowrap">สถานะ</th>
                                <th className="whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        <FileText size={40} className="mx-auto mb-2 opacity-50" />
                                        <p>ไม่มีสัญญา</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map(contract => {
                                    const shop = getShop(contract.shopId);
                                    return (
                                        <tr key={contract.id}>
                                            <td>
                                                <span className="font-medium">{contract.contractNumber}</span>
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
                                                <span className="font-semibold">{formatCurrency(contract.monthlyRent)}</span>
                                            </td>
                                            <td>
                                                <div className="text-sm">
                                                    <p>{formatDate(contract.startDate)}</p>
                                                    <p className="text-gray-500">ถึง {formatDate(contract.endDate)}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(contract.status)}
                                                    {getStatusBadge(contract.status)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedContract(contract);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                        className="btn-icon"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {contract.status === 'draft' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedContract(contract);
                                                                setIsSignatureModalOpen(true);
                                                            }}
                                                            className="btn-icon text-blue-600"
                                                            title="ส่งให้ลงนาม"
                                                        >
                                                            <Send size={18} />
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

            {/* Create Contract Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="สร้างสัญญาเช่าใหม่"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ร้านค้า *</label>
                        <select
                            value={formData.shopId}
                            onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                            className="input-field w-full"
                        >
                            <option value="">เลือกร้านค้า</option>
                            {shops.map(shop => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name} (แผง {shop.stallNumber})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มสัญญา *</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="input-field w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุดสัญญา *</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="input-field w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ค่าเช่า/เดือน (บาท) *</label>
                            <input
                                type="number"
                                value={formData.monthlyRent || ''}
                                onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || 0 })}
                                className="input-field w-full"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ค่ามัดจำ (บาท)</label>
                            <input
                                type="number"
                                value={formData.depositAmount || ''}
                                onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
                                className="input-field w-full"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">เงื่อนไขการเช่า</label>
                        <textarea
                            value={formData.terms}
                            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            className="input-field w-full"
                            rows={4}
                            placeholder="ระบุเงื่อนไขการเช่า..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="btn-secondary flex-1"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleCreateContract}
                            disabled={isSubmitting}
                            className="btn-primary flex-1"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            สร้างสัญญา
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="รายละเอียดสัญญา"
            >
                {selectedContract && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-bold">{selectedContract.contractNumber}</span>
                            {getStatusBadge(selectedContract.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">ร้านค้า</p>
                                <p className="font-semibold">{getShop(selectedContract.shopId)?.name}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">ค่าเช่า/เดือน</p>
                                <p className="font-semibold text-blue-600">{formatCurrency(selectedContract.monthlyRent)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">ค่ามัดจำ</p>
                                <p className="font-semibold">{formatCurrency(selectedContract.depositAmount)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">ระยะเวลา</p>
                                <p className="font-semibold text-sm">
                                    {formatDate(selectedContract.startDate)} - {formatDate(selectedContract.endDate)}
                                </p>
                            </div>
                        </div>

                        {selectedContract.terms && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm mb-2">เงื่อนไขการเช่า</p>
                                <p className="whitespace-pre-wrap">{selectedContract.terms}</p>
                            </div>
                        )}

                        {/* Signatures */}
                        {(selectedContract.landlordSignatureUrl || selectedContract.tenantSignatureUrl) && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedContract.landlordSignatureUrl && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-gray-500 text-sm mb-2">ลายเซ็นผู้ให้เช่า</p>
                                        <img src={selectedContract.landlordSignatureUrl} alt="Landlord Signature" className="max-h-24" />
                                    </div>
                                )}
                                {selectedContract.tenantSignatureUrl && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-gray-500 text-sm mb-2">ลายเซ็นผู้เช่า</p>
                                        <img src={selectedContract.tenantSignatureUrl} alt="Tenant Signature" className="max-h-24" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="btn-secondary flex-1"
                            >
                                ปิด
                            </button>
                            {selectedContract.status === 'draft' && (
                                <button
                                    onClick={() => {
                                        setIsSignatureModalOpen(true);
                                    }}
                                    className="btn-primary flex-1"
                                >
                                    <Send size={18} />
                                    ส่งให้ลงนาม
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Signature Modal */}
            <Modal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                title="ลงนามแล้วส่งให้ลูกค้า"
            >
                {selectedContract && (
                    <div className="space-y-4">
                        <p className="text-gray-600">ลงลายมือชื่อผู้ให้เช่า แล้วส่งสัญญาให้ลูกค้าลงนาม</p>
                        <SignaturePad
                            onSave={(signatureUrl) => handleSendForSignature(selectedContract, signatureUrl)}
                            onCancel={() => setIsSignatureModalOpen(false)}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
