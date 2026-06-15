"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function PortalEntry({ portalRole }: { portalRole: string }) {
    const { startKeycloakLogin, loading } = useAuth();
    const [error, setError] = React.useState<string | null>(null);
    
    useEffect(() => {
        if (!loading) {
            const redirectUri = `${window.location.origin}/auth/callback`;
            startKeycloakLogin(redirectUri, portalRole).then(res => {
                if (!res.success) {
                    setError(res.error || "Failed to start Keycloak login.");
                }
            });
        }
    }, [loading, startKeycloakLogin, portalRole]);

    if (error) {
        return (
            <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center">
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg max-w-md text-center">
                    <p className="font-semibold mb-2">Login Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-4" />
            <p className="text-white/60 font-medium">Entering {portalRole.replace('_', ' ')} portal...</p>
        </div>
    );
}
