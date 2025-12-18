import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white relative">
            <div className="pattern-bg" />
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
