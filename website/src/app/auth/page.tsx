"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ChevronLeft, Shield } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { FloatingHex } from "@/app/components/ui/floating-hex";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Redesigned Auth Page
 *
 * Sign In  → email + password only. No role tabs.
 *             Server returns role from DB → frontend auto-redirects.
 * Sign Up  → always creates a STUDENT account. No role picker.
 *
 * Mentor / Admin accounts are created by admins from the admin dashboard.
 * Super Admin is seeded on first boot — no UI for it here.
 */

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
    const { user, login, signup, testLogin, superAdminLogin, loading: authLoading, USER_ROLES } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuperAdmin, setShowSuperAdmin] = useState(false);
    const [secretCode, setSecretCode] = useState("");

    // Redirect if already logged in (role-aware)
    React.useEffect(() => {
        if (user) {
            redirectByRole(router, (user as any)?.role || "student");
        }
    }, [user, router]);

    // ── Ctrl+Shift+S → toggle super admin secret code panel ──
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
                e.preventDefault();
                setShowSuperAdmin((prev) => !prev);
                setError("");
                setSecretCode("");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ── Sign In ── (no role sent → server auto-detects from DB)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await login(email, password, null);
            if (!result.success) {
                throw new Error(result.error || "Login failed");
            }
            // Redirect based on role returned by server
            const role = result.user?.role || "student";
            redirectByRole(router, role);
        } catch (err: any) {
            const msg = err?.message || "";
            if (msg.includes("Invalid email or password") || msg.includes("invalid-credential")) {
                setError("Invalid email or password.");
            } else if (msg.includes("deactivated")) {
                setError("Your account has been deactivated. Contact an administrator.");
            } else if (msg.includes("Email not confirmed")) {
                setError("Please confirm your email address before signing in.");
            } else {
                setError(msg || "Failed to sign in");
            }
        }
        setLoading(false);
    };

    // ── Sign Up ── (always student role)
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const result = await signup(email, password, "student", displayName);
            if (!result.success) {
                throw new Error(result.error || "Signup failed");
            }
            if (result?.needsEmailConfirmation) {
                setSuccess(result.message || "Account created! Check your email to confirm.");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err?.message || "Failed to create account");
        }
        setLoading(false);
    };

    // ── Super Admin login ──
    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await superAdminLogin(secretCode);
            if (result.success) {
                router.push("/super-admin");
            } else {
                throw new Error("Super admin login failed");
            }
        } catch (err: any) {
            setError(err?.message || "Invalid secret code");
        }
        setLoading(false);
    };

    // ── Quick test login ──
    const handleTestLogin = async (role: string) => {
        setLoading(true);
        setError("");
        try {
            const result = await testLogin(role);
            if (result.success) {
                redirectByRole(router, result.user?.role || role);
            } else {
                throw new Error(result.error || "Test login failed");
            }
        } catch (err: any) {
            setError(err?.message || "Test login failed");
        }
        setLoading(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-0 relative overflow-hidden flex items-center justify-center" tabIndex={0}>
            {/* Background layers */}
            <div className="absolute inset-0 honeycomb-bg opacity-40 pointer-events-none" />
            <div className="absolute inset-0 honeycomb-shimmer pointer-events-none" />

            {/* Spotlights */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse, rgba(255,193,7,0.08) 0%, rgba(255,193,7,0.03) 30%, transparent 60%)",
                }}
            />
            <div
                className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
                style={{
                    background: "linear-gradient(to top, var(--surface-0), transparent)",
                }}
            />

            {/* Floating hexes */}
            <FloatingHex size={64} x="8%" y="15%" delay={0} opacity={0.06} rotation={15} />
            <FloatingHex size={40} x="88%" y="20%" delay={0.5} opacity={0.04} rotation={-10} />
            <FloatingHex size={52} x="85%" y="70%" delay={1} opacity={0.05} rotation={25} />
            <FloatingHex size={36} x="12%" y="75%" delay={1.5} opacity={0.04} rotation={-20} />

            {/* Content */}
            <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
                {/* Back to home */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease }}
                >
                    <a
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-yellow-400 transition-colors duration-200 mb-8 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to home
                    </a>
                </motion.div>

                {/* Auth Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, delay: 0.1, ease }}
                    className="relative"
                >
                    {/* Card glow border */}
                    <div
                        className="absolute -inset-px rounded-2xl pointer-events-none"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,193,7,0.15) 0%, transparent 40%, transparent 60%, rgba(255,193,7,0.1) 100%)",
                        }}
                    />

                    <div className="relative bg-surface-1/80 backdrop-blur-2xl rounded-2xl border border-white/[0.06] p-8 overflow-hidden">
                        {/* Inner glow */}
                        <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none"
                            style={{
                                background: "radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, transparent 70%)",
                            }}
                        />

                        {/* Logo */}
                        <div className="relative flex flex-col items-center mb-8">
                            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,193,7,0.2)]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-6 h-6">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {isLoginMode ? "Welcome Back" : "Create Account"}
                            </h1>
                            <p className="text-sm text-white/40 mt-1">
                                {isLoginMode
                                    ? "Sign in to continue to CODE BUD"
                                    : "Start your coding journey today"}
                            </p>
                        </div>

                        {/* Mode Toggle: Sign In / Sign Up */}
                        <div className="relative flex bg-surface-3/50 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => { setIsLoginMode(true); setError(""); setSuccess(""); }}
                                className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isLoginMode ? "text-surface-0" : "text-white/40 hover:text-white/60"}`}
                            >
                                {isLoginMode && (
                                    <motion.div
                                        layoutId="authToggle"
                                        className="absolute inset-0 bg-yellow-400 rounded-lg"
                                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                                    />
                                )}
                                <span className="relative z-10">Sign In</span>
                            </button>
                            <button
                                onClick={() => { setIsLoginMode(false); setError(""); setSuccess(""); }}
                                className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!isLoginMode ? "text-surface-0" : "text-white/40 hover:text-white/60"}`}
                            >
                                {!isLoginMode && (
                                    <motion.div
                                        layoutId="authToggle"
                                        className="absolute inset-0 bg-yellow-400 rounded-lg"
                                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                                    />
                                )}
                                <span className="relative z-10">Sign Up</span>
                            </button>
                        </div>

                        {/* Error / Success messages */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2"
                                >
                                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-red-400">{error}</span>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                                >
                                    <span className="text-sm text-green-400">{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="space-y-4">
                            {/* Display Name — sign up only */}
                            <AnimatePresence>
                                {!isLoginMode && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                            Display Name
                                        </label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                                            <input
                                                type="text"
                                                placeholder="Your name"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full bg-surface-2/50 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30 focus:ring-1 focus:ring-yellow-400/20 transition-all duration-200"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-surface-2/50 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30 focus:ring-1 focus:ring-yellow-400/20 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder={isLoginMode ? "••••••••" : "Min 6 characters"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={isLoginMode ? undefined : 6}
                                        className="w-full bg-surface-2/50 border border-white/[0.08] rounded-xl py-3 pl-10 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30 focus:ring-1 focus:ring-yellow-400/20 transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative bg-yellow-400 text-surface-0 py-3.5 rounded-xl font-semibold text-sm hover:bg-yellow-300 transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,193,7,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {isLoginMode ? "Signing In..." : "Creating Account..."}
                                    </>
                                ) : (
                                    <>
                                        {isLoginMode ? "Sign In" : "Create Student Account"}
                                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Hint for mentors/admins */}
                        {isLoginMode && !showSuperAdmin && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-center text-xs text-white/20 mt-4"
                            >
                                Mentor or admin?{" "}
                                <span className="text-white/30">Sign in with the credentials your admin provided.</span>
                            </motion.p>
                        )}

                        {/* Super Admin Secret Code Panel (Ctrl+Shift+S) */}
                        <AnimatePresence>
                            {showSuperAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-6 pt-6 border-t border-red-500/20 overflow-hidden"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield size={14} className="text-red-400" />
                                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Super Admin Access</span>
                                    </div>
                                    <form onSubmit={handleSuperAdminLogin} className="space-y-3">
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400/40" />
                                            <input
                                                type="password"
                                                placeholder="Enter secret code"
                                                value={secretCode}
                                                onChange={(e) => setSecretCode(e.target.value)}
                                                required
                                                autoFocus
                                                className="w-full bg-red-500/5 border border-red-500/20 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-red-400/25 focus:outline-none focus:border-red-400/40 focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || !secretCode}
                                            className="w-full bg-red-500/20 text-red-400 py-3 rounded-xl font-semibold text-sm border border-red-500/20 hover:bg-red-500/30 hover:border-red-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <><Loader2 size={14} className="animate-spin" /> Authenticating...</>
                                            ) : (
                                                <><Shield size={14} /> Access Super Admin</>
                                            )}
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-red-400/30 text-center mt-3">
                                        Press Ctrl+Shift+S to close
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick test access */}
                        {isLoginMode && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 pt-6 border-t border-white/[0.06]"
                            >
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold text-center mb-3">
                                    Quick Test Access
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleTestLogin(USER_ROLES.STUDENT)}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-3 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/10 transition-all duration-200 disabled:opacity-50"
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTestLogin(USER_ROLES.MENTOR)}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-3 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/10 transition-all duration-200 disabled:opacity-50"
                                    >
                                        Mentor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTestLogin(USER_ROLES.ADMIN)}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-3 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/10 transition-all duration-200 disabled:opacity-50"
                                    >
                                        Admin
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-xs text-white/20 mt-8"
                >
                    By continuing, you agree to CODE BUD&apos;s{" "}
                    <Link href="/terms" className="text-white/30 hover:text-yellow-400 transition-colors underline underline-offset-2">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-white/30 hover:text-yellow-400 transition-colors underline underline-offset-2">
                        Privacy Policy
                    </Link>
                </motion.p>
            </div>
        </div>
    );
}
