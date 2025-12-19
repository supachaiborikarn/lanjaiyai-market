'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    User as UserIcon,
    Shield,
    Store,
    Eye,
    EyeOff
} from 'lucide-react';
import { User, Shop } from '@/types';
import {
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getShops,
    getCurrentUser
} from '@/lib/storage-supabase';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'shop_owner' as 'admin' | 'shop_owner',
        shopId: ''
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            router.push('/');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, shopsData] = await Promise.all([
                getUsers(),
                getShops()
            ]);
            setUsers(usersData);
            setShops(shopsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                name: user.name,
                role: user.role,
                shopId: user.shopId || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                name: '',
                role: 'shop_owner',
                shopId: ''
            });
        }
        setError('');
        setShowPassword(false);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.username.trim()) {
            setError('กรุณากรอก Username');
            return;
        }

        if (!editingUser && !formData.password.trim()) {
            setError('กรุณากรอก Password');
            return;
        }

        if (!formData.name.trim()) {
            setError('กรุณากรอกชื่อ');
            return;
        }

        // Check for duplicate username
        const existingUser = users.find(
            u => u.username === formData.username && u.id !== editingUser?.id
        );
        if (existingUser) {
            setError('Username นี้มีอยู่ในระบบแล้ว');
            return;
        }

        setSaving(true);

        try {
            if (editingUser) {
                const updates: Partial<User> = {
                    username: formData.username,
                    name: formData.name,
                    role: formData.role,
                    shopId: formData.role === 'shop_owner' ? formData.shopId || undefined : undefined
                };
                if (formData.password.trim()) {
                    updates.password = formData.password;
                }
                await updateUser(editingUser.id, updates);
            } else {
                await addUser({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role,
                    shopId: formData.role === 'shop_owner' ? formData.shopId || undefined : undefined
                });
            }
            await loadData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving user:', error);
            setError('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
            alert('ไม่สามารถลบ Admin คนสุดท้ายได้');
            return;
        }

        if (confirm(`ต้องการลบผู้ใช้ "${user.name}" ใช่หรือไม่?`)) {
            try {
                await deleteUser(user.id);
                await loadData();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('เกิดข้อผิดพลาดในการลบ');
            }
        }
    };

    const getShopName = (shopId?: string) => {
        if (!shopId) return '-';
        const shop = shops.find(s => s.id === shopId);
        return shop ? shop.name : '-';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">จัดการผู้ใช้งาน</h1>
                    <p className="text-slate-500 mt-1">เพิ่ม ลบ แก้ไขผู้ใช้ Admin และ Shop Owner</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    เพิ่มผู้ใช้
                </button>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ชื่อ</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Username</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ประเภท</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ร้านค้า</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin'
                                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                                    : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                                                } text-white font-bold`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-800">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {user.role === 'admin' ? <Shield size={14} /> : <Store size={14} />}
                                            {user.role === 'admin' ? 'Admin' : 'Shop Owner'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{getShopName(user.shopId)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    ชื่อผู้ใช้
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full"
                                    placeholder="ชื่อ-นามสกุล"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="input w-full"
                                    placeholder="Username สำหรับเข้าสู่ระบบ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Password {editingUser && <span className="text-slate-400">(เว้นว่างถ้าไม่เปลี่ยน)</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="input w-full pr-10"
                                        placeholder={editingUser ? '••••••••' : 'Password'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    ประเภทผู้ใช้
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'shop_owner' })}
                                    className="input w-full"
                                >
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                    <option value="shop_owner">Shop Owner (เจ้าของร้าน)</option>
                                </select>
                            </div>

                            {formData.role === 'shop_owner' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        เชื่อมต่อกับร้านค้า
                                    </label>
                                    <select
                                        value={formData.shopId}
                                        onChange={e => setFormData({ ...formData, shopId: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="">-- ไม่เชื่อมต่อ --</option>
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>
                                                {shop.stallNumber}. {shop.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn btn-secondary flex-1"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            {editingUser ? <Pencil size={18} /> : <Plus size={18} />}
                                            {editingUser ? 'บันทึก' : 'เพิ่มผู้ใช้'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
