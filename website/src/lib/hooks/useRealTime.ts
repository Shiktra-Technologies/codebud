"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAllUsers } from "@/lib/services/supabaseService";
import { getAllSubmissions } from "@/lib/services/submissionService";

export type RealTimeStatus = "connected" | "connecting" | "error" | "refreshing";

interface Student {
    _id: string;
    id?: string;
    email: string;
    display_name?: string;
    role?: string;
    last_active?: string;
    created_at?: string;
}

interface Submission {
    _id: string;
    id?: string;
    user_id: string;
    test_type: string;
    score: number;
    total_questions: number;
    submitted_at: string;
    violations?: number;
    [key: string]: any;
}

interface UseRealTimeOptions {
    pollInterval?: number;
    enableRealTime?: boolean;
}

interface UseRealTimeReturn {
    students: Student[];
    submissions: Submission[];
    activeStudents: Student[];
    status: RealTimeStatus;
    activeCount: number;
    submissionCount: number;
    refresh: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

export function useRealTime(options: UseRealTimeOptions = {}): UseRealTimeReturn {
    const { pollInterval = 3000, enableRealTime = true } = options;

    const [students, setStudents] = useState<Student[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeStudents, setActiveStudents] = useState<Student[]>([]);
    const [status, setStatus] = useState<RealTimeStatus>("connecting");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch data from MongoDB API
    const fetchData = useCallback(async () => {
        try {
            setStatus("refreshing");

            // Fetch all users
            const studentsData = await getAllUsers();

            // Fetch all submissions
            const submissionsResult = await getAllSubmissions();
            const submissionsData = Array.isArray(submissionsResult)
                ? submissionsResult
                : submissionsResult?.data || [];

            setStudents(studentsData || []);
            setSubmissions(submissionsData || []);

            // Calculate active students (active in last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const active = (studentsData || []).filter(
                (student: any) => student.last_active && student.last_active > fiveMinutesAgo
            );
            setActiveStudents(active);

            setStatus("connected");
            setError(null);
        } catch (err: any) {
            console.error("Real-time fetch error:", err);
            setError(err.message || "Failed to fetch data");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Setup polling (MongoDB doesn't have native real-time subscriptions)
    useEffect(() => {
        // Initial fetch
        fetchData();

        // Start polling if enabled
        if (enableRealTime && pollInterval > 0) {
            pollTimerRef.current = setInterval(() => {
                fetchData();
            }, pollInterval);
        }

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [pollInterval, fetchData, enableRealTime]);

    return {
        students,
        submissions,
        activeStudents,
        status,
        activeCount: activeStudents.length,
        submissionCount: submissions.length,
        refresh: fetchData,
        loading,
        error,
    };
}
