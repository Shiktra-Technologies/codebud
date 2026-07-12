"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateUserActivity } from "@/lib/services/supabaseService";

const CHANNEL_NAME = "codebud_activity";

/**
 * ActivityTracker — invisible component that sends heartbeat pings
 * to keep user's `last_active` timestamp fresh in the database.
 *
 * Features:
 * - Heartbeat every 60 s
 * - User interaction pings (debounced to 60 s)
 * - Page visibility change detection (ping on return to tab)
 * - BroadcastChannel cross-tab sync (coalesce pings across tabs)
 */
export default function ActivityTracker() {
    const { user } = useAuth();
    const lastPing = useRef<number>(0);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const isLeaderTab = useRef<boolean>(true);

    const ping = useCallback(
        (source?: string) => {
            const userId = (user as any)?._id || (user as any)?.id;
            if (!userId) return;

            const now = Date.now();
            // Debounce: don't ping more than once every 60 seconds — the admin
            // "active users" view only needs 5-minute freshness, and faster
            // pinging eats into the backend's per-route rate limit.
            if (now - lastPing.current < 60_000) return;
            lastPing.current = now;

            updateUserActivity(userId);

            // Broadcast to other tabs so they don't duplicate
            try {
                channelRef.current?.postMessage({
                    type: "activity_ping",
                    userId,
                    timestamp: now,
                    source: source || "interaction",
                });
            } catch {
                // BroadcastChannel may not be supported
            }
        },
        [user],
    );

    // ── BroadcastChannel cross-tab sync ──
    useEffect(() => {
        if (typeof BroadcastChannel === "undefined") return;

        try {
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channelRef.current = channel;

            channel.onmessage = (event) => {
                if (event.data?.type === "activity_ping" && event.data?.timestamp) {
                    // Another tab already pinged — update our debounce timer
                    lastPing.current = Math.max(lastPing.current, event.data.timestamp);
                }
            };

            return () => {
                channel.close();
                channelRef.current = null;
            };
        } catch {
            // BroadcastChannel not supported
        }
    }, []);

    // ── Visibility change detection ──
    useEffect(() => {
        if (!user) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                // User returned to this tab — send a ping
                ping("visibility");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [user, ping]);

    // ── Heartbeat interval every 30 seconds ──
    useEffect(() => {
        if (!user) return;

        // Immediate first ping
        ping("init");

        // Skip heartbeats while the tab is hidden — the user isn't active, and
        // the visibilitychange handler pings on return.
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                ping("heartbeat");
            }
        }, 60_000);
        return () => clearInterval(interval);
    }, [user, ping]);

    // ── Ping on user interaction (mouse, key, scroll, touch) ──
    useEffect(() => {
        if (!user) return;

        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click",
        ];

        const handler = () => ping("interaction");

        events.forEach((event) =>
            document.addEventListener(event, handler, { passive: true }),
        );

        return () => {
            events.forEach((event) =>
                document.removeEventListener(event, handler),
            );
        };
    }, [user, ping]);

    return null; // renders nothing
}
