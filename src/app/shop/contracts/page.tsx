'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Edit3,
    Loader2,
    Calendar
} from 'lucide-react';
import {
    getCurrentUser,
    getShopById,
    getContractsByShop,
    signContract
} from '@/lib/storage-supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { User, Shop, Contract, CONTRACT_STATUS_LABELS, ContractStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { SignaturePad } from '@/components/ui/SignaturePad';

export default function ShopContractsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'shop_owner') {
            router.push('/');
            return;
        }

        setUser(currentUser);

        if (currentUser.shopId) {
            try {
                const [shopData, contractsData] = await Promise.all([
                    getShopById(currentUser.shopId),
                    getContractsByShop(currentUser.shopId)
                ]);
                if (shopData) {
                    setShop(shopData);
                    setContracts(contractsData);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        setLoading(false);
    };

    const handleSign = async (signatureUrl: string) => {
        if (!selectedContract) return;

        setIsSubmitting(true);
        try {
            await signContract(selectedContract.id, signatureUrl);
            showToast('ลงนามสัญญาเรียบร้อยแล้ว', 'success');
            setIsSignatureModalOpen(false);
            setIsDetailModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error signing contract:', error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
        }
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
            default: return <FileText size={20} className="text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

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

    // Find pending contract that needs signing
    const pendingContract = contracts.find(c => c.status === 'pending_signature');
    const activeContract = contracts.find(c => c.status === 'signed');

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">สัญญาเช่า</h1>
                    <p className="text-gray-500 mt-1 text-sm">ดูสัญญาเช่าของ {shop.name}</p>
                </div>
            </div>

            {/* Pending Signature Alert */}
            {pendingContract && (
                <div className="card p-4 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Edit3 size={24} className="text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-800">
                                มีสัญญารอลงนาม
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                กรุณาตรวจสอบและลงนามในสัญญาเลขที่ {pendingContract.contractNumber}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedContract(pendingContract);
                                setIsDetailModalOpen(true);
                            }}
                            className="btn btn-primary"
                        >
                            ดูสัญญา
                        </button>
                    </div>
                </div>
            )}

            {/* Active Contract Card */}
            {activeContract && (
                <div className="card p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800">สัญญาปัจจุบัน</h3>
                            <p className="text-sm text-green-600">{activeContract.contractNumber}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-green-600">ค่าเช่า/เดือน</p>
                            <p className="font-bold text-green-800">{formatCurrency(activeContract.monthlyRent)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-green-600">ค่ามัดจำ</p>
                            <p className="font-bold text-green-800">{formatCurrency(activeContract.depositAmount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-green-600">วันเริ่มสัญญา</p>
                            <p className="font-bold text-green-800">{formatDate(activeContract.startDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-green-600">วันสิ้นสุดสัญญา</p>
                            <p className="font-bold text-green-800">{formatDate(activeContract.endDate)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Contracts List */}
            <div className="card">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">ประวัติสัญญาทั้งหมด</h2>
                </div>
                <div className="divide-y">
                    {contracts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText size={40} className="mx-auto mb-2 opacity-50" />
                            <p>ยังไม่มีสัญญาเช่า</p>
                        </div>
                    ) : (
                        contracts.map(contract => (
                            <div
                                key={contract.id}
                                className="p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                    setSelectedContract(contract);
                                    setIsDetailModalOpen(true);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(contract.status)}
                                        <div>
                                            <p className="font-medium">{contract.contractNumber}</p>
                                            <p className="text-sm text-gray-500">
                                                <Calendar size={14} className="inline mr-1" />
                                                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(contract.status)}
                                        <p className="text-sm font-semibold text-blue-600 mt-1">
                                            {formatCurrency(contract.monthlyRent)}/เดือน
                                        </p>
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
                                <p className="text-gray-500 text-sm">ค่าเช่า/เดือน</p>
                                <p className="font-semibold text-blue-600">{formatCurrency(selectedContract.monthlyRent)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">ค่ามัดจำ</p>
                                <p className="font-semibold">{formatCurrency(selectedContract.depositAmount)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">วันเริ่มสัญญา</p>
                                <p className="font-semibold">{formatDate(selectedContract.startDate)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm">วันสิ้นสุดสัญญา</p>
                                <p className="font-semibold">{formatDate(selectedContract.endDate)}</p>
                            </div>
                        </div>

                        {selectedContract.terms && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm mb-2">เงื่อนไขการเช่า</p>
                                <p className="whitespace-pre-wrap text-sm">{selectedContract.terms}</p>
                            </div>
                        )}

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm mb-2">ลายเซ็นผู้ให้เช่า</p>
                                {selectedContract.landlordSignatureUrl ? (
                                    <img src={selectedContract.landlordSignatureUrl} alt="Landlord Signature" className="max-h-20" />
                                ) : (
                                    <p className="text-gray-400 text-sm">-</p>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-500 text-sm mb-2">ลายเซ็นผู้เช่า</p>
                                {selectedContract.tenantSignatureUrl ? (
                                    <img src={selectedContract.tenantSignatureUrl} alt="Tenant Signature" className="max-h-20" />
                                ) : (
                                    <p className="text-gray-400 text-sm">-</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="btn btn-secondary flex-1"
                            >
                                ปิด
                            </button>
                            {selectedContract.status === 'pending_signature' && (
                                <button
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    className="btn btn-primary flex-1"
                                >
                                    <Edit3 size={18} />
                                    ลงนามสัญญา
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
                title="ลงนามสัญญา"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-800">
                            กรุณาลงลายมือชื่อของท่านในกรอบด้านล่าง เพื่อยืนยันการเช่าตามเงื่อนไขในสัญญา
                        </p>
                    </div>
                    <SignaturePad
                        onSave={handleSign}
                        onCancel={() => setIsSignatureModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
}
