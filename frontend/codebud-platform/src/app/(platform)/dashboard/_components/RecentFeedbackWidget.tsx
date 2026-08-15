import React from "react";
import { MessageSquare, Star } from "lucide-react";
import { EmptyState } from "@/app/components/ui/empty-state";

export default function RecentFeedbackWidget() {
    return (
        <div className="bg-surface-2/30 border border-white/[0.04] rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-white/[0.04] flex items-center justify-between bg-surface-2/50">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-yellow-400" />
                    <h3 className="font-semibold text-white">Recent Feedback</h3>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <EmptyState
                    icon={Star}
                    title="No feedback received yet"
                    description="Submit a task or project to get reviewed"
                    size="sm"
                />
            </div>

            <div className="p-4 border-t border-white/[0.04] text-center">
                <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
                    View All Feedback →
                </button>
            </div>
        </div>
    );
}
