import React, { useEffect, useState } from "react";
import { getStudentActivity, getStudentActivityForMentor, ActivityEvent } from "../services/activityService";
import { Loader2, Activity, CheckCircle2, FileText, Calendar, ShieldCheck, UserPlus } from "lucide-react";
import { motion } from "motion/react";

export default function ActivityTimelineWidget({ studentId, isMentor = false }: { studentId?: string, isMentor?: boolean }) {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadActivities = async () => {
            setLoading(true);
            let data: ActivityEvent[] = [];
            if (isMentor && studentId) {
                data = await getStudentActivityForMentor(studentId);
            } else if (!isMentor) {
                data = await getStudentActivity();
            }
            setActivities(data);
            setLoading(false);
        };
        
        loadActivities();
    }, [studentId, isMentor]);

    const getIcon = (type: string) => {
        switch (type) {
            case "MENTOR_ASSIGNED": return <UserPlus size={16} className="text-yellow-400" />;
            case "TASK_ASSIGNED": return <FileText size={16} className="text-blue-400" />;
            case "TASK_SUBMITTED": return <CheckCircle2 size={16} className="text-purple-400" />;
            case "TASK_REVIEWED": return <ShieldCheck size={16} className="text-green-400" />;
            case "PROJECT_SUBMITTED": return <CheckCircle2 size={16} className="text-indigo-400" />;
            case "PROJECT_REVIEWED": return <ShieldCheck size={16} className="text-emerald-400" />;
            case "MEETING_REQUESTED": return <Calendar size={16} className="text-pink-400" />;
            case "MEETING_APPROVED": return <Calendar size={16} className="text-teal-400" />;
            default: return <Activity size={16} className="text-white/40" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10 bg-surface-1/50 rounded-2xl border border-white/[0.04]">
                <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-10 bg-surface-1/50 rounded-2xl border border-white/[0.04]">
                <Activity className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30 font-medium">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-1/50 rounded-2xl border border-white/[0.04] p-6">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Mentorship Journey</h3>
            </div>

            <div className="relative border-l-2 border-white/[0.04] ml-3 space-y-6">
                {activities.map((activity, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={activity._id} 
                        className="relative pl-6"
                    >
                        <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-surface-2 border-2 border-surface-0 flex items-center justify-center shadow-lg">
                            {getIcon(activity.action_type)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white/90">{activity.description}</p>
                            <p className="text-[11px] text-white/30 mt-1 uppercase tracking-wider font-medium">
                                {new Date(activity.created_at).toLocaleString()}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
