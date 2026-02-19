"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { FloatingHex } from "@/app/components/ui/floating-hex";

const ease = [0.16, 1, 0.3, 1] as const;

export default function AuthPage() {
    const router = useRouter();
    const { user, login, signup, testLogin, superAdminLogin, loading: authLoading, USER_ROLES } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [loginType, setLoginType] = useState("user"); // 'user', 'admin', 'super_admin'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSecretField, setShowSecretField] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const isTestAccount = async (email: string, password: string) => {
        try {
            const { TEST_ACCOUNTS } = await import("@/lib/config/testAccounts");
            const isTestStudent = TEST_ACCOUNTS.STUDENTS.some((s: any) => s.email === email && s.password === password);
            const isTestAdmin = TEST_ACCOUNTS.ADMINS.some((a: any) => a.email === email && a.password === password);
            return isTestStudent || isTestAdmin;
        } catch {
            return false;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (loginType === "super_admin") {
                if (!secretCode) {
                    setError("Secret code is required for super admin access");
                    setLoading(false);
                    return;
                }
                await superAdminLogin(secretCode);
                router.push("/super-admin");
            } else {
                const isTest = await isTestAccount(email, password);
                const selectedRole = loginType === "admin" ? USER_ROLES.ADMIN : USER_ROLES.STUDENT;

                if (isTest) {
                    await testLogin(selectedRole);
                } else {
                    await login(email, password, selectedRole);
                }

                if (loginType === "admin") {
                    router.push("/admin");
                } else {
                    router.push("/dashboard");
                }
            }
        } catch (err: any) {
            let errorMessage = "Failed to sign in: ";
            const msg = err?.message || "";
            if (msg.includes("Invalid super admin secret code")) {
                errorMessage = "Invalid super admin secret code.";
            } else if (msg.includes("Access denied")) {
                errorMessage = msg;
            } else if (msg.includes("Email not confirmed")) {
                errorMessage = "Please confirm your email address before signing in.";
            } else if (msg.includes("Invalid login credentials") || msg.includes("invalid-credential")) {
                errorMessage = "Invalid email or password.";
            } else if (msg.includes("user-not-found")) {
                errorMessage = "No account found with this email.";
            } else {
                errorMessage += msg;
            }
            setError(errorMessage);
        }
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const result = await signup(email, password);
            if (result?.needsEmailConfirmation) {
                setSuccess(result.message || "Account created successfully!");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err?.message || "Failed to sign up");
        }
        setLoading(false);
    };

    // Secret key combination for super admin
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === "S") {
            setShowSecretField(true);
            setLoginType("super_admin");
            e.preventDefault();
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
        <div className="min-h-screen bg-surface-0 relative overflow-hidden flex items-center justify-center" onKeyDown={handleKeyPress} tabIndex={0}>
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
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-yellow-400 transition-colors duration-200 mb-8 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to home
                    </Link>
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
                                {isLoginMode ? "Sign in to continue to CODE BUD" : "Start your coding journey today"}
                            </p>
                        </div>

                        {/* Mode Toggle */}
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
                                onClick={() => { setIsLoginMode(false); setError(""); setSuccess(""); setLoginType("user"); }}
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

                        {/* Role selector (login only) */}
                        {isLoginMode && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="flex gap-2 mb-6"
                            >
                                {[
                                    { id: "user", label: "Student" },
                                    { id: "admin", label: "Admin" },
                                    ...(showSecretField ? [{ id: "super_admin", label: "Super Admin" }] : []),
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => { setLoginType(role.id); setError(""); }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${loginType === role.id
                                            ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                            : "bg-surface-2/50 border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10"
                                            }`}
                                    >
                                        {role.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}

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
                            {loginType === "super_admin" && isLoginMode ? (
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                        Secret Code
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                                        <input
                                            type="password"
                                            placeholder="Enter secret code"
                                            value={secretCode}
                                            onChange={(e) => setSecretCode(e.target.value)}
                                            required
                                            className="w-full bg-surface-2/50 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30 focus:ring-1 focus:ring-yellow-400/20 transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
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

                                    <div>
                                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
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
                                </>
                            )}

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
                                        {isLoginMode
                                            ? `Sign In${loginType !== "user" ? ` as ${loginType === "admin" ? "Admin" : "Super Admin"}` : ""}`
                                            : "Create Account"}
                                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Test accounts quick access */}
                        {isLoginMode && loginType !== "super_admin" && (
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
                                        onClick={async () => {
                                            setLoading(true);
                                            setError("");
                                            try {
                                                await testLogin(USER_ROLES.STUDENT);
                                                router.push("/dashboard");
                                            } catch (err: any) {
                                                setError(err?.message || "Test login failed");
                                            }
                                            setLoading(false);
                                        }}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-3 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/10 transition-all duration-200 disabled:opacity-50"
                                    >
                                        🧪 Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setLoading(true);
                                            setError("");
                                            try {
                                                await testLogin(USER_ROLES.ADMIN);
                                                router.push("/admin");
                                            } catch (err: any) {
                                                setError(err?.message || "Test login failed");
                                            }
                                            setLoading(false);
                                        }}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-3 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 hover:border-white/10 transition-all duration-200 disabled:opacity-50"
                                    >
                                        🛡️ Admin
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
