'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullPage?: boolean;
}

const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
};

export function LoadingSpinner({ size = 'md', text, fullPage = false }: LoadingSpinnerProps) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
            {text && <p className="text-gray-500 text-sm">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                {content}
            </div>
        );
    }

    return content;
}

// Page-level loading component
export function PageLoading({ text = 'กำลังโหลดข้อมูล...' }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 size={48} className="mx-auto text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500">{text}</p>
            </div>
        </div>
    );
}

// Inline loading for buttons/actions
export function InlineLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
    return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
}
