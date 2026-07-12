import React from "react";
import { Video, Calendar, ArrowUpRight } from "lucide-react";

export default function UpcomingMeetingWidget() {
    return (
        <div className="bg-surface-2/30 border border-white/[0.04] rounded-2xl flex flex-col h-full overflow-hidden relative group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-teal-400/10 transition-colors" />

            <div className="p-5 border-b border-white/[0.04] flex items-center justify-between bg-surface-2/50 relative z-10">
                <div className="flex items-center gap-2">
                    <Video size={18} className="text-teal-400" />
                    <h3 className="font-semibold text-white">Next Meeting</h3>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-4 border border-teal-400/20">
                    <Calendar className="w-6 h-6 text-teal-400" />
                </div>
                <h4 className="text-white font-medium mb-1">No Meetings Scheduled</h4>
                <p className="text-xs text-white/40 mb-5 max-w-[200px]">
                    Sync up with your mentor to review code and discuss career goals.
                </p>

                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-400/10 text-teal-400 text-sm font-semibold hover:bg-teal-400/20 transition-colors border border-teal-400/20">
                    Request Meeting
                    <ArrowUpRight size={14} />
                </button>
            </div>
        </div>
    );
}
