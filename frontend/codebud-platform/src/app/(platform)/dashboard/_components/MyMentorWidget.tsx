"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Calendar, MessageSquare, Briefcase, GraduationCap, ArrowRight, FolderUp } from "lucide-react";
import { getMyMentor, getStudentTasks, getStudentProjects, MentorUser, MentorshipTask, MentorshipProject } from "@/lib/services/mentorshipService";
import StudentProjectUploadModal from "./StudentProjectUploadModal";

interface MyMentorWidgetProps {
    // When provided (dashboard passes them from the aggregated /api/dashboard
    // payload), the widget renders from props and makes no requests of its own.
    mentor?: MentorUser | null;
    tasks?: MentorshipTask[];
    projects?: MentorshipProject[];
    loading?: boolean;
}

export default function MyMentorWidget(props: MyMentorWidgetProps) {
    const hasExternalData = props.mentor !== undefined;

    const [ownMentor, setOwnMentor] = useState<MentorUser | null>(null);
    const [ownTasks, setOwnTasks] = useState<MentorshipTask[]>([]);
    const [ownProjects, setOwnProjects] = useState<MentorshipProject[]>([]);
    const [ownLoading, setOwnLoading] = useState(true);

    const mentor = hasExternalData ? (props.mentor ?? null) : ownMentor;
    const tasks = hasExternalData ? (props.tasks ?? []) : ownTasks;
    const projects = hasExternalData ? (props.projects ?? []) : ownProjects;
    const loading = hasExternalData ? (props.loading ?? false) : ownLoading;

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<MentorshipProject | null>(null);

    const loadData = async () => {
        setOwnLoading(true);
        try {
            const [{ mentor }, fetchedTasks, fetchedProjects] = await Promise.all([
                getMyMentor(),
                getStudentTasks(),
                getStudentProjects()
            ]);
            setOwnMentor(mentor);
            setOwnTasks(fetchedTasks);
            setOwnProjects(fetchedProjects);
        } catch (err) {
            console.error(err);
        }
        setOwnLoading(false);
    };

    useEffect(() => {
        if (!hasExternalData) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasExternalData]);

    if (loading) {
        return (
            <div className="bg-surface-2/50 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 animate-pulse h-[200px]" />
        );
    }

    if (!mentor) {
        return (
            <div className="bg-surface-2/50 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 text-center">
                <GraduationCap className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white/80">Mentorship Ecosystem</h3>
                <p className="text-xs text-white/30 mt-1">
                    You have not been assigned a mentor yet.
                </p>
            </div>
        );
    }

    const activeTasks = tasks.filter(t => t.status !== "Completed" && t.status !== "Submitted");
    const activeProjects = projects.filter(p => p.status !== "Completed" && p.status !== "Submitted");
    const mentorName = mentor.display_name || mentor.email?.split("@")[0] || "Mentor";

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-2/50 backdrop-blur-xl rounded-2xl border border-yellow-400/20 p-6 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[50px] pointer-events-none" />
            
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black font-bold text-lg shadow-[0_0_15px_rgba(255,193,7,0.2)]">
                        {mentorName[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-widest mb-0.5">My Mentor</p>
                        <h3 className="text-base font-bold text-white">{mentorName}</h3>
                        <p className="text-xs text-white/40">{mentor.bio || "Senior Developer"}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-surface-3/30 border border-white/[0.04] rounded-xl p-3 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Active Tasks</p>
                    <p className="text-lg font-bold text-white">{activeTasks.length}</p>
                </div>
                <div className="bg-surface-3/30 border border-white/[0.04] rounded-xl p-3 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Active Projects</p>
                    <p className="text-lg font-bold text-emerald-400">{activeProjects.length}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition-colors">
                        <Calendar size={14} /> Schedule
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-3/50 text-white text-xs font-medium rounded-lg hover:bg-surface-3 transition-colors border border-white/[0.06]">
                        <Briefcase size={14} /> Tasks
                    </button>
                </div>
                {activeProjects.length > 0 && (
                    <button 
                        onClick={() => { setSelectedProject(activeProjects[0]); setUploadModalOpen(true); }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                    >
                        <FolderUp size={14} /> Submit Next Project
                    </button>
                )}
            </div>

            <StudentProjectUploadModal 
                isOpen={uploadModalOpen} 
                onClose={() => setUploadModalOpen(false)} 
                project={selectedProject} 
                onSuccess={() => { loadData(); setUploadModalOpen(false); }}
            />
        </motion.div>
    );
}
