'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Zap,
    CreditCard,
    FileText,
    LogOut,
    Menu,
    X,
    Receipt,
    Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '@/lib/storage-supabase';
import { useRouter } from 'next/navigation';

interface MenuItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const adminMenuItems: MenuItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/shops', label: 'จัดการร้านค้า', icon: <Store size={20} /> },
    { href: '/admin/users', label: 'จัดการผู้ใช้', icon: <Users size={20} /> },
    { href: '/admin/contracts', label: 'สัญญาเช่า', icon: <FileText size={20} /> },
    { href: '/admin/meters', label: 'จดมิเตอร์', icon: <Zap size={20} /> },
    { href: '/admin/invoices', label: 'ใบวางบิล', icon: <Receipt size={20} /> },
    { href: '/admin/payments', label: 'การชำระเงิน', icon: <CreditCard size={20} /> },
    { href: '/admin/reports', label: 'รายงาน', icon: <FileText size={20} /> }
];

const shopMenuItems: MenuItem[] = [
    { href: '/shop/dashboard', label: 'หน้าหลัก', icon: <LayoutDashboard size={20} /> },
    { href: '/shop/contracts', label: 'สัญญาเช่า', icon: <FileText size={20} /> },
    { href: '/shop/invoices', label: 'ใบวางบิล', icon: <Receipt size={20} /> },
    { href: '/shop/payments', label: 'ชำระเงิน', icon: <CreditCard size={20} /> }
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<{ role: string; name: string } | null>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser({ role: currentUser.role, name: currentUser.name });
        }
    }, []);

    const menuItems = user?.role === 'admin' ? adminMenuItems : shopMenuItems;

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="fixed top-4 left-4 z-[60] lg:hidden btn btn-secondary p-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Store size={20} />
                        </div>
                        ลานใจใหญ่
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">ระบบบริหารจัดการตลาด</p>
                </div>

                {/* User Info */}
                {user && (
                    <div className="px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">{user.name}</p>
                                <p className="text-slate-400 text-xs">
                                    {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าของร้าน'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu */}
                <nav className="py-4 flex-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut size={20} />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>
        </>
    );
}
