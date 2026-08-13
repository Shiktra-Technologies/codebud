"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { defaultRouteForRole } from "@/lib/auth/roleRouting";

function redirectAfterAuth(router: ReturnType<typeof useRouter>, user: any) {
    if (!user) {
        router.replace('/auth');
        return;
    }

    const role: string = user?.role || '';
    const isNewUser = Boolean(user?.is_new_user ?? false);
    const isOnboarded = Boolean(user?.is_onboarded ?? user?.onboarding_completed ?? false);

    console.log('[KC ROLES]', { role, isOnboarded, isNewUser });

    if (!isOnboarded || isNewUser) {
        router.replace('/onboarding');
        return;
    }

    router.replace(defaultRouteForRole(role));
}

export default function AuthCallbackPage() {
    const router = useRouter();
    const { user, exchangeAuthorizationCode, logout } = useAuth();
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (user && !error) {
            redirectAfterAuth(router, user);
        }
    }, [user, router, error]);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");

        if (!code) {
            setError("No authorization code received from Keycloak.");
            return;
        }

        let active = true;

        (async () => {
            const redirectUri = `${window.location.origin}/auth/callback`;
            const result = await exchangeAuthorizationCode(code, redirectUri);
            if (!active) return;

            if (!result.success) {
                setError(result.error || "Authentication failed");
                return;
            }

            const actualRole = result.user?.role;
            
            // STRICT INTENT VALIDATION (Fail-Closed)
            if (!state) {
                console.error(`[AUTH] Security Violation: OAuth state is missing in callback.`);
                await logout();
                setError(`Access Denied: Authentication context is missing. Please initiate login from a valid portal.`);
                return;
            }

            if (actualRole !== state) {
                console.error(`[AUTH] Intent Mismatch. Requested: ${state}, Actual: ${actualRole}`);
                await logout();
                setError(`Access Denied: Your role (${actualRole}) does not match the requested portal (${state}).`);
                return;
            }

            window.history.replaceState({}, "", "/auth/callback");
            redirectAfterAuth(router, result.user);
        })();

        return () => {
            active = false;
        };
    }, [exchangeAuthorizationCode, logout, router]);

    return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-1/80 backdrop-blur-xl p-8 text-center">
                {error ? (
                    <>
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-left">
                            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/auth")}
                            className="mt-4 px-6 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-105 transition"
                        >
                            Back to Login
                        </button>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-4" />
                        <p className="text-white/60 text-sm">Completing authentication...</p>
                    </>
                )}
            </div>
        </div>
    );
}
