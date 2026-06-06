"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function PortalEntry({ portalRole }: { portalRole: string }) {
    const { startKeycloakLogin, loading } = useAuth();
    
    useEffect(() => {
        if (!loading) {
            const redirectUri = `${window.location.origin}/auth/callback`;
            startKeycloakLogin(redirectUri, portalRole);
        }
    }, [loading, startKeycloakLogin, portalRole]);

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-4" />
            <p className="text-white/60 font-medium">Entering {portalRole.replace('_', ' ')} portal...</p>
        </div>
    );
}
