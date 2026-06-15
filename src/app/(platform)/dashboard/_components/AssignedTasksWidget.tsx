import React from "react";
import { CheckSquare, ArrowRight, Loader2, Clock } from "lucide-react";
import { MentorshipTask } from "@/lib/services/mentorshipService";

export default function AssignedTasksWidget({ tasks, loading }: { tasks: MentorshipTask[], loading: boolean }) {
    if (loading) {
        return (
            <div className="bg-surface-2/30 border border-white/[0.04] rounded-2xl p-6 flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status !== "Approved" && t.status !== "Completed").slice(0, 3);

    return (
        <div className="bg-surface-2/30 border border-white/[0.04] rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-white/[0.04] flex items-center justify-between bg-surface-2/50">
                <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-blue-400" />
                    <h3 className="font-semibold text-white">Assigned Tasks</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-400/10 text-blue-400">
                    {pendingTasks.length} Pending
                </span>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-3">
                {pendingTasks.length > 0 ? (
                    pendingTasks.map(task => (
                        <div key={task._id} className="group bg-surface-1/50 border border-white/[0.04] hover:border-blue-400/20 p-4 rounded-xl transition-all flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">{task.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-md font-semibold tracking-wider uppercase text-[10px] ${
                                        task.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                                        task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-white/5 text-white/40'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                            <button className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-white/40 group-hover:bg-blue-400/10 group-hover:text-blue-400 transition-colors">
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-6">
                        <CheckSquare size={32} className="text-white/20 mb-3" />
                        <p className="text-sm text-white/60">No pending tasks</p>
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-white/[0.04] text-center">
                <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
                    View All Tasks →
                </button>
            </div>
        </div>
    );
}
