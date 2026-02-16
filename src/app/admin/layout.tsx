import { SidebarClient } from "@/components/admin/SidebarClient";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <SidebarClient />

            {/* Main Content */}
            <main className="flex-1 ml-[260px] overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
