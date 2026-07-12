"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { getMyAlerts, markAlertAsRead, Alert } from "../services/alertService";
import Link from "next/link";

export default function AlertsDropdown() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadAlerts = async () => {
        setLoading(true);
        const data = await getMyAlerts(false); // Fetch all to show history, or just unread? Let's fetch all.
        setAlerts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadAlerts();

        // Polling every 30s; skip ticks while the tab is hidden.
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                loadAlerts();
            }
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (alertId: string) => {
        const success = await markAlertAsRead(alertId);
        if (success) {
            setAlerts(alerts.map(a => a._id === alertId ? { ...a, is_read: true } : a));
        }
    };

    const unreadCount = alerts.filter(a => !a.is_read).length;

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "critical": return <AlertCircle size={16} className="text-red-400" />;
            case "high": return <AlertCircle size={16} className="text-amber-400" />;
            case "medium": return <Info size={16} className="text-blue-400" />;
            default: return <Info size={16} className="text-white/40" />;
        }
    };

    const getPriorityBg = (priority: string) => {
        switch (priority) {
            case "critical": return "bg-red-500/10 border-red-500/20";
            case "high": return "bg-amber-500/10 border-amber-500/20";
            case "medium": return "bg-blue-500/10 border-blue-500/20";
            default: return "bg-surface-2/30 border-white/[0.04]";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-surface-1/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                            {loading && alerts.length === 0 ? (
                                <p className="text-xs text-white/30 text-center py-4">Loading...</p>
                            ) : alerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                    <p className="text-xs text-white/30">You're all caught up!</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div 
                                        key={alert._id} 
                                        className={`relative p-3 rounded-xl border transition-colors flex gap-3 ${
                                            alert.is_read 
                                                ? "bg-surface-1/50 border-transparent opacity-60" 
                                                : getPriorityBg(alert.priority)
                                        }`}
                                    >
                                        <div className="mt-0.5">
                                            {getPriorityIcon(alert.priority)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${alert.is_read ? 'text-white/70' : 'text-white'}`}>
                                                {alert.title}
                                            </p>
                                            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-white/30">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </span>
                                                {alert.link && (
                                                    <Link 
                                                        href={alert.link} 
                                                        className="text-[10px] text-yellow-400 hover:text-yellow-300 font-medium"
                                                        onClick={() => {
                                                            if (!alert.is_read) handleMarkAsRead(alert._id);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        View Details →
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {!alert.is_read && (
                                            <button 
                                                onClick={() => handleMarkAsRead(alert._id)}
                                                className="absolute top-2 right-2 p-1 text-white/20 hover:text-white/60 transition-colors"
                                                title="Mark as read"
                                            >
                                                <CheckCircle2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
