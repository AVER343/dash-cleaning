"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// Icons (Simple SVGs for premium feel)
const DashboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
const BookingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const LocationsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const PricingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const LINKS = [
    { href: "/admin", label: "Overview", icon: DashboardIcon },
    { href: "/admin/bookings", label: "Bookings", icon: BookingsIcon },
    { href: "/admin/locations", label: "Locations", icon: LocationsIcon },
    { href: "/admin/pricing", label: "Pricing", icon: PricingIcon },
];

export function SidebarClient() {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        try {
            setLoggingOut(true);
            await fetch("/api/admin/auth/logout", { method: "POST" });
            router.push("/admin/login");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <aside className="fixed inset-y-0 left-0 w-[260px] bg-white border-r border-border flex flex-col z-50">
            {/* Logo Area */}
            <div className="px-6 py-8 border-b border-border/50">
                <span className="text-xl font-bold text-foreground tracking-tight">Home Cleaning</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {LINKS.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                                ? "bg-blue-50 text-accent"
                                : "text-gray-600 hover:bg-gray-50 hover:text-foreground"
                                }`}
                        >
                            <span className={`${isActive ? "text-accent" : "text-gray-400 group-hover:text-gray-600"}`}>
                                <Icon />
                            </span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-border/50">
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-danger transition-all duration-200 group"
                >
                    <span className="text-gray-400 group-hover:text-danger px-1">
                        <LogoutIcon />
                    </span>
                    {loggingOut ? "Signing out..." : "Sign out"}
                </button>
            </div>
        </aside>
    );
}
