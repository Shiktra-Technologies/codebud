import React, { useEffect, useState } from "react";
import { Bell, AlertTriangle, ShieldAlert, AlertCircle, ArrowRight } from "lucide-react";
import { getMyAlerts, Alert, markAlertAsRead } from "@/lib/services/alertService";

interface DashboardAlertsWidgetProps {
    // When provided (dashboard passes the aggregated /api/dashboard payload),
    // the widget renders from props and makes no request of its own.
    alerts?: Alert[];
}

export default function DashboardAlertsWidget({ alerts: externalAlerts }: DashboardAlertsWidgetProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        if (externalAlerts !== undefined) {
            setAlerts(externalAlerts.filter(a => !a.is_read).slice(0, 3)); // Only show unread
            return;
        }
        const fetchAlerts = async () => {
            const data = await getMyAlerts(true);
            setAlerts(data.slice(0, 3)); // Only show unread
        };
        fetchAlerts();
    }, [externalAlerts]);

    const handleMarkRead = async (id: string) => {
        await markAlertAsRead(id);
        setAlerts(prev => prev.filter(a => a._id !== id));
    };

    if (alerts.length === 0) {
        return null; // Don't show if no alerts to save space
    }

    return (
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-red-500/10 flex items-center gap-2">
                <Bell size={18} className="text-red-400" />
                <h3 className="font-semibold text-red-400">Action Required</h3>
            </div>
            <div className="p-4 flex flex-col gap-2">
                {alerts.map(alert => (
                    <div key={alert._id} className="bg-surface-1/50 border border-white/[0.04] p-3 rounded-xl flex items-start gap-3">
                        <div className="mt-0.5">
                            {alert.priority === 'high' || alert.priority === 'critical' ? (
                                <ShieldAlert size={16} className="text-red-400" />
                            ) : alert.priority === 'medium' ? (
                                <AlertTriangle size={16} className="text-yellow-400" />
                            ) : (
                                <AlertCircle size={16} className="text-blue-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white/90">{alert.title}</h4>
                            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{alert.message}</p>
                        </div>
                        <button 
                            onClick={() => handleMarkRead(alert._id)}
                            className="text-xs font-medium text-white/30 hover:text-white bg-white/5 px-2 py-1 rounded-md transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
