import apiClient from '@/lib/apiClient';

export interface AptitudeQuestion {
    id: string;
    question: string;
    options: string[];
    correct: number;
    category?: string;
    hint?: string;
}

interface AptitudeQuestionsResponse {
    success: boolean;
    course_id?: string;
    count?: number;
    questions?: AptitudeQuestion[];
    error?: string;
}

export async function getAptitudeQuestions(params?: { courseId?: string; limit?: number }) {
    const query: Record<string, string | number> = {};

    if (params?.courseId) {
        query.course_id = params.courseId;
    }
    if (typeof params?.limit === 'number' && params.limit > 0) {
        query.limit = params.limit;
    }

    const response = await apiClient.get<AptitudeQuestionsResponse>('/api/aptitude/questions', {
        params: query,
    });

    return response.data;
}

export default {
    getAptitudeQuestions,
};
