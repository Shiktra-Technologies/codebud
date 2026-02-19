"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    Bug,
    RefreshCw,
    Database,
    Globe,
    Server,
    Wifi,
    WifiOff,
    CheckCircle2,
    XCircle,
    Clock,
    Copy,
    Check,
} from "lucide-react";
import apiClient from "@/lib/apiClient";

const ease = [0.16, 1, 0.3, 1] as const;

interface HealthStatus {
    status: string;
    database?: string;
    timestamp?: string;
    version?: string;
    [key: string]: unknown;
}

export default function DebugTab() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const checkHealth = async () => {
        setChecking(true);
        setError(null);
        try {
            const res = await apiClient.get("/api/health");
            setHealth(res.data);
        } catch (err: any) {
            setError(err.message || "Failed to connect to backend");
            setHealth(null);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const isOnline = health?.status === "healthy" || health?.status === "ok";

    const localStorageKeys = typeof window !== "undefined"
        ? Object.keys(localStorage).filter((k) => k.includes("submission") || k.includes("leaderboard") || k.includes("job") || k.includes("user") || k.includes("token"))
        : [];

    const copyDebugInfo = () => {
        const info = {
            health,
            error,
            localStorage: localStorageKeys.reduce((acc, key) => {
                const val = localStorage.getItem(key);
                acc[key] = val ? `${val.substring(0, 100)}...` : null;
                return acc;
            }, {} as Record<string, string | null>),
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
            timestamp: new Date().toISOString(),
        };
        navigator.clipboard.writeText(JSON.stringify(info, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            {/* Status Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
                className={`rounded-xl border p-5 mb-6 ${isOnline
                    ? "bg-emerald-400/5 border-emerald-400/20"
                    : error
                        ? "bg-red-400/5 border-red-400/20"
                        : "bg-surface-2/50 border-white/[0.06]"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {checking ? (
                            <RefreshCw size={20} className="text-yellow-400 animate-spin" />
                        ) : isOnline ? (
                            <Wifi size={20} className="text-emerald-400" />
                        ) : (
                            <WifiOff size={20} className="text-red-400" />
                        )}
                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Backend: {checking ? "Checking…" : isOnline ? "Connected" : "Offline"}
                            </h3>
                            <p className="text-xs text-white/30 mt-0.5">
                                {health?.timestamp ? `Last check: ${new Date(health.timestamp).toLocaleString()}` : error || "Checking connection..."}
                            </p>
                        </div>
                    </div>
                    <button onClick={checkHealth} disabled={checking}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-2/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 transition-all disabled:opacity-50">
                        <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
                        Recheck
                    </button>
                </div>
            </motion.div>

            {/* System Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "API Server", value: isOnline ? "Running" : "Down", icon: Server, ok: isOnline },
                    { label: "Database", value: health?.database || (isOnline ? "Connected" : "Unknown"), icon: Database, ok: isOnline && health?.database !== "disconnected" },
                    { label: "API Version", value: health?.version || "—", icon: Globe, ok: true },
                ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease }}
                            className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/25">{item.label}</span>
                                <Icon size={14} className="text-white/20" />
                            </div>
                            <div className="flex items-center gap-2">
                                {item.ok ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-red-400 shrink-0" />}
                                <span className={`text-sm font-medium ${item.ok ? "text-emerald-400" : "text-red-400"}`}>{item.value}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* LocalStorage Keys */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease }}
                className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden mb-6">
                <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
                    <h3 className="text-sm font-semibold text-white/80">LocalStorage Data</h3>
                    <span className="text-[11px] text-white/25">{localStorageKeys.length} keys</span>
                </div>
                {localStorageKeys.length === 0 ? (
                    <div className="p-8 text-center">
                        <Database size={20} className="mx-auto mb-2 text-white/15" />
                        <p className="text-xs text-white/25">No relevant localStorage entries found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04] max-h-[300px] overflow-y-auto">
                        {localStorageKeys.map((key) => {
                            const val = typeof window !== "undefined" ? localStorage.getItem(key) : "";
                            const size = val ? new Blob([val]).size : 0;
                            return (
                                <div key={key} className="px-5 py-2.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
                                    <span className="text-xs text-white/50 font-mono">{key}</span>
                                    <span className="text-[10px] text-white/20 tabular-nums">{size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Copy Debug Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4, ease }}
                className="bg-surface-2/30 rounded-xl border border-white/[0.04] p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white/40">Debug Information</h3>
                        <p className="text-xs text-white/20 mt-0.5">Copy complete debug state for troubleshooting</p>
                    </div>
                    <button onClick={copyDebugInfo}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs font-medium text-white/40 hover:text-white/60 transition-all">
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy Debug Info"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
