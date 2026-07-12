import React from "react";
import { motion } from "motion/react";
import { CheckSquare, FolderGit2, Video, MessageSquare } from "lucide-react";

interface MentorshipQuickStatsProps {
    activeTasksCount: number;
    pendingProjectsCount: number;
    upcomingMeetingsCount: number;
    feedbackCount: number;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function MentorshipQuickStats({
    activeTasksCount,
    pendingProjectsCount,
    upcomingMeetingsCount,
    feedbackCount
}: MentorshipQuickStatsProps) {
    const stats = [
        { label: "Active Tasks", value: activeTasksCount, icon: CheckSquare, color: "text-blue-400", bg: "bg-blue-400/10", border: "group-hover:border-blue-400/30" },
        { label: "Pending Projects", value: pendingProjectsCount, icon: FolderGit2, color: "text-purple-400", bg: "bg-purple-400/10", border: "group-hover:border-purple-400/30" },
        { label: "Upcoming Meetings", value: upcomingMeetingsCount, icon: Video, color: "text-teal-400", bg: "bg-teal-400/10", border: "group-hover:border-teal-400/30" },
        { label: "Recent Feedback", value: feedbackCount, icon: MessageSquare, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "group-hover:border-yellow-400/30" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5, ease }}
                        className={`group bg-surface-2/40 border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between hover:bg-surface-2/60 transition-colors ${stat.border}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
