import React from "react";
import { MessageSquare, Star, ArrowRight } from "lucide-react";

export default function RecentFeedbackWidget() {
    return (
        <div className="bg-surface-2/30 border border-white/[0.04] rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-white/[0.04] flex items-center justify-between bg-surface-2/50">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-yellow-400" />
                    <h3 className="font-semibold text-white">Recent Feedback</h3>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400/5 flex items-center justify-center mb-4 border border-yellow-400/10">
                    <Star className="w-6 h-6 text-yellow-400/40" />
                </div>
                <p className="text-sm text-white/50 mb-1">No feedback received yet</p>
                <p className="text-xs text-white/30">Submit a task or project to get reviewed</p>
            </div>
            
            <div className="p-4 border-t border-white/[0.04] text-center">
                <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
                    View All Feedback →
                </button>
            </div>
        </div>
    );
}
