"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

function redirectByRole(router: ReturnType<typeof useRouter>, role: string) {
    switch (role) {
        case "super_admin":
            router.push("/super-admin");
            break;
        case "admin":
            router.push("/admin");
            break;
        case "mentor":
            router.push("/mentor");
            break;
        default:
            router.push("/dashboard");
    }
}

export default function AuthPage() {
    const router = useRouter();
    const { user, exchangeAuthorizationCode, startKeycloakLogin, loading: authLoading } = useAuth();
    const [error, setError] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            redirectByRole(router, (user as any)?.role || "student");
        }
    }, [user, router]);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) return;

        let active = true;
        setBusy(true);
        setError("");

        (async () => {
            const redirectUri = `${window.location.origin}/auth/callback`;
            const result = await exchangeAuthorizationCode(code, redirectUri);
            if (!active) return;

            if (!result.success) {
                setError(result.error || "Auth service unavailable");
                setBusy(false);
                return;
            }

            window.history.replaceState({}, "", "/auth");
            redirectByRole(router, result.user?.role || "student");
        })();

        return () => {
            active = false;
        };
    }, [exchangeAuthorizationCode, router]);

    const handleLogin = async () => {
        setError("");
        setBusy(true);
        const redirectUri = `${window.location.origin}/auth/callback`;
        const result = await startKeycloakLogin(redirectUri);
        if (!result.success) {
            setError(result.error || "Auth service unavailable");
            setBusy(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-1/80 backdrop-blur-xl p-8">
                <h1 className="text-2xl font-bold text-white mb-2">Sign In</h1>
                <p className="text-white/60 text-sm mb-6">Authenticate securely using Keycloak OAuth.</p>

                {error ? (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-red-400">{error}</span>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={handleLogin}
                    disabled={busy}
                    className="w-full py-3 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {busy ? "Redirecting..." : "Sign In with Keycloak"}
                </button>
            </div>
        </div>
    );
}
