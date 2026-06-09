import apiClient from "../apiClient";

export interface ActivityEvent {
    _id: string;
    student_id: string;
    action_type: string;
    description: string;
    metadata: any;
    created_at: string;
    created_by: string;
}

export async function getStudentActivity(): Promise<ActivityEvent[]> {
    try {
        const res = await apiClient.get("/api/student/activity");
        if (res.data.success) {
            return res.data.activities;
        }
        return [];
    } catch {
        return [];
    }
}

export async function getStudentActivityForMentor(studentId: string): Promise<ActivityEvent[]> {
    try {
        const res = await apiClient.get(`/api/mentor/students/${studentId}/activity`);
        if (res.data.success) {
            return res.data.activities;
        }
        return [];
    } catch {
        return [];
    }
}
