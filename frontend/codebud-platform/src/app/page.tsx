"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { defaultRouteForRole } from "@/lib/auth/roleRouting";
import { Loader2 } from "lucide-react";

export default function PlatformRoot() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                const role = (user as any)?.role;
                if (role) {
                    router.replace(defaultRouteForRole(role));
                    return;
                }
            }
            router.replace("/auth");
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
    );
}
