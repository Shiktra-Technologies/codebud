"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Calendar, FileText } from "lucide-react";
import { getMentorTasks, getMentorProjects, MentorshipTask, MentorshipProject } from "@/lib/services/mentorshipService";
import MentorReviewModal from "./MentorReviewModal";

export default function MentorTasksWidget() {
    const [tasks, setTasks] = useState<MentorshipTask[]>([]);
    const [projects, setProjects] = useState<MentorshipProject[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<"task" | "project">("task");

    const load = async () => {
        setLoading(true);
        try {
            const [fetchedTasks, fetchedProjects] = await Promise.all([
                getMentorTasks(),
                getMentorProjects()
            ]);
            setTasks(fetchedTasks);
            setProjects(fetchedProjects);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="bg-surface-2/50 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 animate-pulse h-[200px]" />
        );
    }

    const pendingReviewTasks = tasks.filter(t => t.status === "Under Review" || t.status === "Submitted");
    const activeTasks = tasks.filter(t => t.status !== "Completed" && t.status !== "Submitted" && t.status !== "Under Review");
    
    const pendingReviewProjects = projects.filter(p => p.status === "Under Review" || p.status === "Submitted");
    const activeProjects = projects.filter(p => p.status !== "Completed" && p.status !== "Submitted" && p.status !== "Under Review");

    const totalActive = activeTasks.length + activeProjects.length;
    const totalPending = pendingReviewTasks.length + pendingReviewProjects.length;

    return (
        <div className="bg-surface-2/50 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-yellow-400" /> Mentorship Tasks
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-surface-3/30 border border-white/[0.04] rounded-xl p-3 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Active</p>
                    <p className="text-lg font-bold text-emerald-400">{totalActive}</p>
                </div>
                <div className="bg-surface-3/30 border border-white/[0.04] rounded-xl p-3 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Pending Review</p>
                    <p className="text-lg font-bold text-yellow-400">{totalPending}</p>
                </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pendingReviewProjects.map(project => (
                    <div key={project._id} className="flex items-center justify-between p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20 hover:bg-yellow-400/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <FileText size={14} className="text-yellow-400" />
                            <div>
                                <p className="text-sm text-white font-medium">{project.title}</p>
                                <p className="text-[10px] text-yellow-400/60">Project Needs Review</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setSelectedItem(project); setSelectedType("project"); setReviewModalOpen(true); }}
                            className="text-xs text-yellow-400 hover:text-yellow-300 font-medium bg-yellow-400/10 px-3 py-1.5 rounded-lg"
                        >
                            Review
                        </button>
                    </div>
                ))}
                {pendingReviewTasks.slice(0, 3).map(task => (
                    <div key={task._id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:bg-surface-2/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <FileText size={14} className="text-white/40" />
                            <div>
                                <p className="text-sm text-white font-medium">{task.title}</p>
                                <p className="text-[10px] text-white/30">Task Needs Review</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setSelectedItem(task); setSelectedType("task"); setReviewModalOpen(true); }}
                            className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                        >
                            Review
                        </button>
                    </div>
                ))}
                {totalPending === 0 && totalActive > 0 && (
                    <p className="text-xs text-white/30 italic text-center py-2">No tasks or projects pending review.</p>
                )}
                {tasks.length === 0 && projects.length === 0 && (
                    <p className="text-xs text-white/30 italic text-center py-2">No mentorship activity yet.</p>
                )}
            </div>

            <MentorReviewModal 
                isOpen={reviewModalOpen} 
                onClose={() => setReviewModalOpen(false)} 
                item={selectedItem} 
                type={selectedType} 
                onSuccess={() => { load(); setReviewModalOpen(false); }}
            />
        </div>
    );
}
