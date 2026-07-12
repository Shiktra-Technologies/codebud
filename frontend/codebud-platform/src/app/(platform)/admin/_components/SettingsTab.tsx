"use client";

import React from "react";
import { motion } from "motion/react";
import {
    Settings,
    Globe,
    Database,
    Shield,
    Bell,
    Palette,
    Info,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export default function SettingsTab() {
    const settingGroups = [
        {
            title: "Platform",
            icon: Globe,
            items: [
                { label: "Backend API URL", value: "http://3.110.147.93:5001", type: "text" as const },
                { label: "Max submissions per student", value: "10", type: "text" as const },
                { label: "Enable proctoring", value: true, type: "toggle" as const },
            ],
        },
        {
            title: "Database",
            icon: Database,
            items: [
                { label: "MongoDB Atlas", value: "Connected", type: "status" as const },
                { label: "Auto-sync submissions", value: true, type: "toggle" as const },
                { label: "LocalStorage fallback", value: true, type: "toggle" as const },
            ],
        },
        {
            title: "Security",
            icon: Shield,
            items: [
                { label: "JWT token expiry", value: "24 hours", type: "text" as const },
                { label: "Tab-switch violation limit", value: "3", type: "text" as const },
                { label: "Face detection required", value: true, type: "toggle" as const },
            ],
        },
        {
            title: "Notifications",
            icon: Bell,
            items: [
                { label: "Email notifications", value: false, type: "toggle" as const },
                { label: "Real-time alerts", value: true, type: "toggle" as const },
            ],
        },
    ];

    return (
        <div className="max-w-3xl">
            <div className="space-y-6">
                {settingGroups.map((group, gi) => {
                    const Icon = group.icon;
                    return (
                        <motion.div key={group.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: gi * 0.08, ease }}
                            className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                            <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
                                <Icon size={16} className="text-yellow-400/60" />
                                <h3 className="text-sm font-semibold text-white/80">{group.title}</h3>
                            </div>
                            <div className="divide-y divide-white/[0.04]">
                                {group.items.map((item, ii) => (
                                    <div key={ii} className="flex items-center justify-between px-5 py-4">
                                        <span className="text-[13px] text-white/50">{item.label}</span>
                                        {item.type === "toggle" ? (
                                            <div className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${item.value ? "bg-yellow-400" : "bg-surface-4/50"}`}>
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${item.value ? "ml-[18px]" : "ml-0.5"}`} />
                                            </div>
                                        ) : item.type === "status" ? (
                                            <span className="text-xs font-medium text-emerald-400">{item.value as string}</span>
                                        ) : (
                                            <span className="text-xs text-white/30 font-mono bg-surface-3/50 px-2 py-1 rounded">{item.value as string}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4, ease }}
                className="mt-6 bg-surface-2/30 rounded-xl border border-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-xs text-white/25">
                    <Info size={12} />
                    Settings are currently display-only. Full configuration management coming soon.
                </div>
            </motion.div>
        </div>
    );
}
