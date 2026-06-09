import apiClient from "../apiClient";

export interface Alert {
    _id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    priority: "low" | "medium" | "high" | "critical";
    is_read: boolean;
    created_at: string;
}

export async function getMyAlerts(unreadOnly: boolean = false): Promise<Alert[]> {
    try {
        const res = await apiClient.get(`/api/alerts?unread_only=${unreadOnly}`);
        if (res.data.success) {
            return res.data.alerts;
        }
        return [];
    } catch {
        return [];
    }
}

export async function markAlertAsRead(alertId: string): Promise<boolean> {
    try {
        const res = await apiClient.put(`/api/alerts/${alertId}/read`);
        return res.data.success;
    } catch {
        return false;
    }
}
