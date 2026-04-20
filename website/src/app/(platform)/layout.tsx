"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { ProctorProvider } from "@/lib/context/ProctorContext";
import ActivityTracker from "@/lib/components/ActivityTracker";
import { Loader2 } from "lucide-react";

function routeByRole(role?: string): string {
    if (role === "codebud_super_admin" || role === "admin") return "/admin";
    if (role === "mentor") return "/mentor";
    if (role === "company") return "/company";
    if (role === "student") return "/dashboard";
    return "/auth";
}

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/auth");
            return;
        }

        if (!loading && user) {
            const onboarded = Boolean((user as any)?.is_onboarded ?? false);
            const isNewUser = Boolean((user as any)?.is_new_user ?? false);

            if ((!onboarded || isNewUser) && pathname !== "/onboarding") {
                router.replace("/onboarding");
                return;
            }

            if (onboarded && !isNewUser && pathname === "/onboarding") {
                router.replace(routeByRole((user as any)?.role));
            }
        }
    }, [loading, user, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,193,7,0.2)] animate-pulse">
                    <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-6 h-6">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Loading platform...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // will redirect
    }

    return (
        <ProctorProvider>
            <ActivityTracker />
            <div className="min-h-screen bg-surface-0">
                {children}
            </div>
        </ProctorProvider>
    );
}
