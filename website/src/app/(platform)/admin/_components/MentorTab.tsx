"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Users, UserPlus, UserMinus, Search, Loader2, ChevronRight,
    GraduationCap, AlertCircle, Check, X, Shield
} from "lucide-react";
import apiClient from "@/lib/apiClient";

interface UserInfo {
    _id: string;
    email: string;
    display_name?: string;
    role: string;
    created_at?: string;
    last_active?: string;
    status?: string;
}

interface MentorAssignment {
    mentor: UserInfo;
    students: UserInfo[];
}

export default function MentorTab() {
    const [mentors, setMentors] = useState<MentorAssignment[]>([]);
    const [allStudents, setAllStudents] = useState<UserInfo[]>([]);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedMentor, setExpandedMentor] = useState<string | null>(null);

    // Create mentor form
    const [showCreateMentor, setShowCreateMentor] = useState(false);
    const [createForm, setCreateForm] = useState({ email: "", role: "mentor", display_name: "" });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Assign student form
    const [assigningMentor, setAssigningMentor] = useState<string | null>(null);
    const [studentSearch, setStudentSearch] = useState("");
    const [assigning, setAssigning] = useState(false);

    // Status messages
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const usersRes = await apiClient.get("/api/users");
            const users: UserInfo[] = usersRes.data.success ? usersRes.data.data : [];
            setAllUsers(users);

            const mentorUsers = users.filter((u) => u.role === "mentor");
            const studentUsers = users.filter((u) => u.role === "student");
            setAllStudents(studentUsers);

            // Load assignments for each mentor
            const assignments: MentorAssignment[] = [];
            for (const m of mentorUsers) {
                try {
                    const res = await apiClient.get(`/api/mentor/students?mentor_id=${m._id}`);
                    const assignedStudents = res.data.success ? res.data.data : [];
                    assignments.push({ mentor: m, students: assignedStudents });
                } catch {
                    assignments.push({ mentor: m, students: [] });
                }
            }
            setMentors(assignments);
        } catch (err) {
            console.error("[ADMIN] Failed to load mentor data:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const showStatus = (type: "success" | "error", text: string) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg(null), 4000);
    };

    // ── Create Mentor Account ──
    const handleCreateMentor = async () => {
        if (!createForm.email) {
            setCreateError("Email is required");
            return;
        }
        setCreating(true);
        setCreateError("");
        try {
            const res = await apiClient.post("/api/admin/create-user", {
                email: createForm.email.trim().toLowerCase(),
                display_name: createForm.display_name.trim() || undefined,
                role: createForm.role,
            });
            if (res.data.success) {
                showStatus("success", `User ${createForm.email} created as ${createForm.role}`);
                setShowCreateMentor(false);
                setCreateForm({ email: "", role: "mentor", display_name: "" });
                await loadData();
            } else {
                setCreateError(res.data.error || "Failed to create");
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.error || err.message || "Failed");
        }
        setCreating(false);
    };

    // ── Assign Student ──
    const handleAssign = async (mentorId: string, studentId: string) => {
        setAssigning(true);
        try {
            const res = await apiClient.post("/api/mentor/students", {
                mentor_id: mentorId,
                student_id: studentId,
            });
            if (res.data.success) {
                showStatus("success", "Student assigned");
                setAssigningMentor(null);
                setStudentSearch("");
                await loadData();
            } else {
                showStatus("error", res.data.error || "Assignment failed");
            }
        } catch (err: any) {
            showStatus("error", err.response?.data?.error || "Assignment failed");
        }
        setAssigning(false);
    };

    // ── Unassign Student ──
    const handleUnassign = async (mentorId: string, studentId: string) => {
        try {
            const res = await apiClient.delete(`/api/mentor/students/${studentId}?mentor_id=${mentorId}`);
            if (res.data.success) {
                showStatus("success", "Student unassigned");
                await loadData();
            } else {
                showStatus("error", res.data.error || "Failed");
            }
        } catch (err: any) {
            showStatus("error", err.response?.data?.error || "Failed");
        }
    };

    // Get students not yet assigned to this mentor
    const getAvailableStudents = (mentorId: string) => {
        const mentor = mentors.find((m) => m.mentor._id === mentorId);
        const assignedIds = new Set(mentor?.students.map((s) => s._id) || []);
        return allStudents.filter(
            (s) =>
                !assignedIds.has(s._id) &&
                (s.display_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.email.toLowerCase().includes(studentSearch.toLowerCase()))
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status toast */}
            <AnimatePresence>
                {statusMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 shadow-2xl ${statusMsg.type === "success"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                    >
                        {statusMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                        {statusMsg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-white/30">
                        {mentors.length} mentor{mentors.length !== 1 ? "s" : ""} •{" "}
                        {mentors.reduce((sum, m) => sum + m.students.length, 0)} assignments
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateMentor(!showCreateMentor)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
                >
                    <UserPlus size={14} />
                    {showCreateMentor ? "Cancel" : "Create User"}
                </button>
            </div>

            {/* Create Mentor Form */}
            <AnimatePresence>
                {showCreateMentor && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface-2/30 border border-white/[0.06] rounded-xl p-5 space-y-3"
                    >
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <GraduationCap size={16} className="text-yellow-400" />
                            Create New User Account
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                value={createForm.email}
                                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                                placeholder="Email address *"
                                type="email"
                                className="bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                            />
                            <select
                                value={createForm.role}
                                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                                className="bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/30"
                            >
                                <option value="student">Student</option>
                                <option value="mentor">Mentor</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input
                                value={createForm.display_name}
                                onChange={(e) => setCreateForm((f) => ({ ...f, display_name: e.target.value }))}
                                placeholder="Display Name"
                                className="bg-surface-3/50 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                            />
                        </div>
                        {createError && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle size={12} /> {createError}
                            </p>
                        )}
                        <button
                            onClick={handleCreateMentor}
                            disabled={creating}
                            className="px-4 py-2.5 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {creating ? (
                                <><Loader2 size={14} className="animate-spin" /> Creating...</>
                            ) : (
                                <><UserPlus size={14} /> Create User Account</>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mentors List */}
            {mentors.length === 0 ? (
                <div className="text-center py-16">
                    <GraduationCap className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No mentor accounts yet.</p>
                    <p className="text-white/20 text-xs mt-1">Create a mentor to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {mentors.map((ma) => {
                        const expanded = expandedMentor === ma.mentor._id;
                        return (
                            <div
                                key={ma.mentor._id}
                                className="bg-surface-2/30 border border-white/[0.04] rounded-xl overflow-hidden"
                            >
                                {/* Mentor Header */}
                                <button
                                    onClick={() => setExpandedMentor(expanded ? null : ma.mentor._id)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-surface-2/50 transition-all text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
                                        {(ma.mentor.display_name || ma.mentor.email)[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">
                                            {ma.mentor.display_name || ma.mentor.email.split("@")[0]}
                                        </p>
                                        <p className="text-xs text-white/30">{ma.mentor.email}</p>
                                    </div>
                                    <span className="text-xs text-white/20 bg-surface-3/50 px-2.5 py-1 rounded-full">
                                        {ma.students.length} student{ma.students.length !== 1 ? "s" : ""}
                                    </span>
                                    <ChevronRight
                                        size={14}
                                        className={`text-white/20 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                                    />
                                </button>

                                {/* Expanded: Students + Assign */}
                                <AnimatePresence>
                                    {expanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/[0.04]"
                                        >
                                            <div className="p-4 space-y-3">
                                                {/* Assigned Students */}
                                                {ma.students.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider">
                                                            Assigned Students
                                                        </p>
                                                        {ma.students.map((s) => (
                                                            <div
                                                                key={s._id}
                                                                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-3/30 border border-white/[0.04]"
                                                            >
                                                                <div className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                                    {(s.display_name || s.email)[0].toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium text-white truncate">
                                                                        {s.display_name || s.email.split("@")[0]}
                                                                    </p>
                                                                    <p className="text-[10px] text-white/20 truncate">{s.email}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUnassign(ma.mentor._id, s._id)}
                                                                    className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                                    title="Unassign student"
                                                                >
                                                                    <UserMinus size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-white/20 italic">No students assigned yet.</p>
                                                )}

                                                {/* Assign New Student */}
                                                {assigningMentor === ma.mentor._id ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <Search
                                                                    size={14}
                                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                                                />
                                                                <input
                                                                    value={studentSearch}
                                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                                    placeholder="Search students by name or email..."
                                                                    autoFocus
                                                                    className="w-full pl-9 pr-3 py-2 bg-surface-3/50 border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/30"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => { setAssigningMentor(null); setStudentSearch(""); }}
                                                                className="p-2 rounded-lg text-white/30 hover:text-white/50 hover:bg-surface-3/50 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                                            {getAvailableStudents(ma.mentor._id).slice(0, 20).map((s) => (
                                                                <button
                                                                    key={s._id}
                                                                    onClick={() => handleAssign(ma.mentor._id, s._id)}
                                                                    disabled={assigning}
                                                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-400/5 border border-transparent hover:border-yellow-400/20 transition-all text-left disabled:opacity-50"
                                                                >
                                                                    <div className="w-6 h-6 rounded-md bg-green-400/10 flex items-center justify-center text-green-400 text-[10px] font-bold">
                                                                        {(s.display_name || s.email)[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs text-white truncate">
                                                                            {s.display_name || s.email.split("@")[0]}
                                                                        </p>
                                                                        <p className="text-[10px] text-white/20 truncate">{s.email}</p>
                                                                    </div>
                                                                    <UserPlus size={12} className="text-green-400/50" />
                                                                </button>
                                                            ))}
                                                            {getAvailableStudents(ma.mentor._id).length === 0 && (
                                                                <p className="text-xs text-white/20 text-center py-3">
                                                                    {studentSearch ? "No matching students" : "All students assigned"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setAssigningMentor(ma.mentor._id)}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/[0.08] text-xs text-white/30 hover:text-yellow-400 hover:border-yellow-400/20 transition-all w-full justify-center"
                                                    >
                                                        <UserPlus size={12} />
                                                        Assign Student
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
