"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import {
    Loader2,
    AlertCircle,
    GraduationCap,
    BookOpen,
    Shield,
    LogIn,
    UserPlus,
    ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

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

const KC_BASE =
    process.env.NEXT_PUBLIC_KEYCLOAK_URL || "https://keycloak.mycodebud.in";
const KC_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "codebud";
const KC_CLIENT =
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "codebud-app";

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

export default function AuthPage() {
    const router = useRouter();
    const { user, startKeycloakLogin, loading: authLoading } = useAuth();
    const [error, setError] = React.useState("");
    const [busy, setBusy] = React.useState<string | null>(null); // key of the active button

    /* Redirect already-authed users */
    React.useEffect(() => {
        if (user) {
            redirectByRole(router, (user as any)?.role || "student");
        }
    }, [user, router]);

    /* Sign-in via Keycloak (all role buttons + "Sign In") */
    const handleLogin = async (key: string) => {
        setError("");
        setBusy(key);
        const redirectUri = `${window.location.origin}/auth/callback`;
        const result = await startKeycloakLogin(redirectUri);
        if (!result.success) {
            setError(result.error || "Auth service unavailable. Please try again.");
            setBusy(null);
        }
        // On success the browser navigates away — no need to setBusy(null)
    };

    /* Register via Keycloak */
    const handleRegister = (key: string) => {
        setError("");
        setBusy(key);
        const redirectUri = `${window.location.origin}/auth/callback`;
        const url = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/registrations`;
        const params = new URLSearchParams({
            client_id: KC_CLIENT,
            response_type: "code",
            scope: "openid",
            redirect_uri: redirectUri,
        });
        window.location.href = `${url}?${params}`;
    };

    /* ── Loading skeleton ── */
    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
        );
    }

    /* ─────────────────────────────────────────────
       Render
    ───────────────────────────────────────────── */
    return (
        <div
            className="min-h-screen bg-surface-0 honeycomb-bg relative flex items-center justify-center px-4 py-12 overflow-hidden"
            style={{ fontFamily: "var(--font-sans)" }}
        >
            {/* Ambient glow orbs */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(255,193,7,0.12) 0%, transparent 70%)",
                    filter: "blur(40px)",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(255,193,7,0.08) 0%, transparent 70%)",
                    filter: "blur(60px)",
                    animation: "glow-pulse 6s ease-in-out infinite",
                }}
            />

            {/* ── Main card ── */}
            <div
                className="relative w-full max-w-md z-10"
                style={{
                    background:
                        "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,193,7,0.15)",
                    borderRadius: "1.5rem",
                    backdropFilter: "blur(24px)",
                    boxShadow:
                        "0 0 0 1px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.5), 0 0 60px rgba(255,193,7,0.06)",
                    padding: "2.5rem 2rem",
                }}
            >
                {/* ── Hex logo badge ── */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="clip-hex flex items-center justify-center mb-4"
                        style={{
                            width: 64,
                            height: 72,
                            background:
                                "linear-gradient(135deg, #FFC107 0%, #FFD54F 50%, #FFA000 100%)",
                            boxShadow: "0 0 40px rgba(255,193,7,0.4)",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 28,
                                fontWeight: 900,
                                color: "#050505",
                                letterSpacing: "-0.05em",
                                lineHeight: 1,
                            }}
                        >
                            CB
                        </span>
                    </div>
                    <h1
                        className="text-shimmer"
                        style={{
                            fontSize: "2rem",
                            fontWeight: 900,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.1,
                            margin: 0,
                        }}
                    >
                        CODEBUD
                    </h1>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.45)",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            marginTop: "0.35rem",
                        }}
                    >
                        Learn. Build. Grow.
                    </p>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div
                        className="flex items-start gap-2 mb-5 p-3 rounded-xl"
                        style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                        }}
                    >
                        <AlertCircle size={15} className="text-red-400 shrink-0 mt-px" />
                        <span style={{ color: "#f87171", fontSize: "0.82rem" }}>
                            {error}
                        </span>
                    </div>
                )}

                {/* ── Section: Enter as ── */}
                <p
                    style={{
                        color: "rgba(255,255,255,0.3)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        marginBottom: "0.6rem",
                    }}
                >
                    Enter as
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {[
                        { key: "student", label: "Continue as Student", Icon: GraduationCap },
                        { key: "mentor", label: "Continue as Mentor", Icon: BookOpen },
                        { key: "admin", label: "Continue as Admin", Icon: Shield },
                    ].map(({ key, label, Icon }) => (
                        <RoleButton
                            key={key}
                            label={label}
                            Icon={Icon}
                            loading={busy === key}
                            disabled={busy !== null}
                            onClick={() => handleLogin(key)}
                        />
                    ))}
                </div>

                {/* ── Divider ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1.25rem",
                    }}
                >
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em" }}>
                        OR
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* ── Primary: Sign In ── */}
                <PrimaryButton
                    label="Sign In"
                    Icon={LogIn}
                    loading={busy === "signin"}
                    disabled={busy !== null}
                    onClick={() => handleLogin("signin")}
                />

                {/* ── Secondary: Create Account ── */}
                <GhostButton
                    label="Create Account"
                    Icon={UserPlus}
                    loading={busy === "register"}
                    disabled={busy !== null}
                    onClick={() => handleRegister("register")}
                    style={{ marginTop: "0.6rem" }}
                />

                {/* ── Footer note ── */}
                <p
                    style={{
                        color: "rgba(255,255,255,0.18)",
                        fontSize: "0.7rem",
                        textAlign: "center",
                        marginTop: "1.5rem",
                        lineHeight: 1.6,
                    }}
                >
                    All authentication is handled securely via Keycloak SSO.
                    <br />
                    No passwords are stored by CODEBUD.
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

interface BtnProps {
    label: string;
    Icon: React.ElementType;
    loading: boolean;
    disabled: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
}

function RoleButton({ label, Icon, loading, disabled, onClick }: BtnProps) {
    const [hovered, setHovered] = React.useState(false);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "0.75rem",
                border: `1px solid ${hovered && !disabled ? "rgba(255,193,7,0.35)" : "rgba(255,255,255,0.08)"}`,
                background: hovered && !disabled
                    ? "rgba(255,193,7,0.06)"
                    : "rgba(255,255,255,0.03)",
                color: hovered && !disabled ? "#FFC107" : "rgba(255,255,255,0.7)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled && !loading ? 0.5 : 1,
                transition: "all 180ms ease",
                fontWeight: 500,
                fontSize: "0.875rem",
                textAlign: "left",
            }}
        >
            {loading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
            ) : (
                <Icon size={16} style={{ flexShrink: 0, opacity: 0.85 }} />
            )}
            <span style={{ flex: 1 }}>{loading ? "Redirecting…" : label}</span>
            {!loading && (
                <ChevronRight
                    size={14}
                    style={{
                        opacity: hovered && !disabled ? 0.6 : 0.2,
                        transform: hovered && !disabled ? "translateX(2px)" : "none",
                        transition: "all 180ms ease",
                        flexShrink: 0,
                    }}
                />
            )}
        </button>
    );
}

function PrimaryButton({ label, Icon, loading, disabled, onClick }: BtnProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "0.85rem",
                border: "none",
                background: disabled && !loading
                    ? "rgba(255,193,7,0.4)"
                    : "linear-gradient(135deg, #FFC107 0%, #FFD54F 50%, #FFA000 100%)",
                color: "#050505",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled && !loading ? 0.6 : 1,
                fontWeight: 700,
                fontSize: "0.9rem",
                letterSpacing: "0.01em",
                boxShadow: "0 4px 20px rgba(255,193,7,0.25)",
                transition: "all 180ms ease",
            }}
        >
            {loading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
                <Icon size={16} />
            )}
            {loading ? "Redirecting to Keycloak…" : label}
        </button>
    );
}

function GhostButton({ label, Icon, loading, disabled, onClick, style }: BtnProps) {
    const [hovered, setHovered] = React.useState(false);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.85rem",
                border: `1px solid ${hovered && !disabled ? "rgba(255,193,7,0.4)" : "rgba(255,255,255,0.1)"}`,
                background: hovered && !disabled ? "rgba(255,193,7,0.06)" : "transparent",
                color: hovered && !disabled ? "#FFC107" : "rgba(255,255,255,0.55)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled && !loading ? 0.5 : 1,
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 180ms ease",
                ...style,
            }}
        >
            {loading ? (
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
                <Icon size={15} />
            )}
            {loading ? "Opening Registration…" : label}
        </button>
    );
}
