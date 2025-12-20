'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, login as loginApi, logout as logoutApi, setCurrentUser } from '@/lib/storage-supabase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES, SHOP_ROUTES } from '@/lib/constants';

interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isShopOwner: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => void;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        try {
            const loggedInUser = await loginApi(username, password);
            if (loggedInUser) {
                setUser(loggedInUser);
                // Redirect based on role
                if (loggedInUser.role === 'admin') {
                    router.push(ADMIN_ROUTES.DASHBOARD);
                } else {
                    router.push(SHOP_ROUTES.DASHBOARD);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }, [router]);

    const logout = useCallback(() => {
        logoutApi();
        setUser(null);
        router.push('/');
    }, [router]);

    return {
        user,
        loading,
        isAdmin: user?.role === 'admin',
        isShopOwner: user?.role === 'shop_owner',
        login,
        logout,
        refreshUser
    };
}
