'use client';

import { useState, useEffect, useCallback } from 'react';
import { getShops, addShop as addShopApi, updateShop as updateShopApi, deleteShop as deleteShopApi } from '@/lib/storage-supabase';
import { Shop } from '@/types';
import { handleError, showSuccess, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/errors';

interface UseShopsReturn {
    shops: Shop[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    addShop: (shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Shop | null>;
    updateShop: (id: string, updates: Partial<Shop>) => Promise<Shop | null>;
    deleteShop: (id: string) => Promise<boolean>;
    getShopById: (id: string) => Shop | undefined;
}

export function useShops(): UseShopsReturn {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchShops = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getShops();
            setShops(data);
        } catch (err) {
            setError(ERROR_MESSAGES.LOAD_FAILED);
            handleError(err, ERROR_MESSAGES.LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    const addShop = useCallback(async (shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shop | null> => {
        try {
            const newShop = await addShopApi(shop);
            setShops(prev => [...prev, newShop]);
            showSuccess(SUCCESS_MESSAGES.SAVE_SUCCESS);
            return newShop;
        } catch (err) {
            handleError(err, ERROR_MESSAGES.SAVE_FAILED);
            return null;
        }
    }, []);

    const updateShop = useCallback(async (id: string, updates: Partial<Shop>): Promise<Shop | null> => {
        try {
            const updatedShop = await updateShopApi(id, updates);
            if (updatedShop) {
                setShops(prev => prev.map(s => s.id === id ? updatedShop : s));
                showSuccess(SUCCESS_MESSAGES.SAVE_SUCCESS);
            }
            return updatedShop;
        } catch (err) {
            handleError(err, ERROR_MESSAGES.SAVE_FAILED);
            return null;
        }
    }, []);

    const deleteShop = useCallback(async (id: string): Promise<boolean> => {
        try {
            const success = await deleteShopApi(id);
            if (success) {
                setShops(prev => prev.filter(s => s.id !== id));
                showSuccess(SUCCESS_MESSAGES.DELETE_SUCCESS);
            }
            return success;
        } catch (err) {
            handleError(err, ERROR_MESSAGES.DELETE_FAILED);
            return false;
        }
    }, []);

    const getShopById = useCallback((id: string): Shop | undefined => {
        return shops.find(s => s.id === id);
    }, [shops]);

    return {
        shops,
        loading,
        error,
        refetch: fetchShops,
        addShop,
        updateShop,
        deleteShop,
        getShopById
    };
}
