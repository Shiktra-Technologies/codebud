"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateUserActivity } from "@/lib/services/supabaseService";

/**
 * ActivityTracker — invisible component that sends heartbeat pings
 * to keep user's `last_active` timestamp fresh in the database.
 *
 * Heartbeat every 30 s, plus on user interaction (debounced).
 */
export default function ActivityTracker() {
    const { user } = useAuth();
    const lastPing = useRef<number>(0);

    const ping = useCallback(() => {
        const userId = (user as any)?._id || (user as any)?.id;
        if (!userId) return;

        const now = Date.now();
        // Debounce: don't ping more than once every 15 seconds
        if (now - lastPing.current < 15_000) return;
        lastPing.current = now;

        updateUserActivity(userId);
    }, [user]);

    // Heartbeat interval every 30 seconds
    useEffect(() => {
        if (!user) return;

        // Immediate first ping
        ping();

        const interval = setInterval(ping, 30_000);
        return () => clearInterval(interval);
    }, [user, ping]);

    // Ping on user interaction (mouse, key, scroll, touch)
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

        events.forEach((event) =>
            document.addEventListener(event, ping, { passive: true }),
        );

        return () => {
            events.forEach((event) =>
                document.removeEventListener(event, ping),
            );
        };
    }, [user, ping]);

    return null; // renders nothing
}
