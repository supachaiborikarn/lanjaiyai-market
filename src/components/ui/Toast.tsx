'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <XCircle size={20} />;
            case 'info': return <Info size={20} />;
        }
    };

    return (
        <div className={`toast toast-${type} flex items-center gap-3`}>
            {getIcon()}
            <span className="flex-1">{message}</span>
            <button onClick={onClose} className="p-1 hover:opacity-80">
                <X size={16} />
            </button>
        </div>
    );
}

// Toast Container for managing multiple toasts
interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

let toastId = 0;
let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    if (addToastFn) {
        addToastFn({ message, type });
    }
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        addToastFn = (toast) => {
            const id = String(++toastId);
            setToasts(prev => [...prev, { ...toast, id }]);
        };
        return () => {
            addToastFn = null;
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}
