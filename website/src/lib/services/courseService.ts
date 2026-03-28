import apiClient from '@/lib/apiClient';

/**
 * Course Service — API calls for course CRUD, enrollment, reviews
 */

export interface Lesson {
    _id: string;
    title: string;
    type: 'text' | 'video' | 'code_challenge' | 'quiz' | 'assignment';
    content: string;
    duration_minutes: number;
    order: number;
}

export interface Section {
    _id: string;
    title: string;
    order: number;
    lessons: Lesson[];
}

export interface Course {
    _id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_hours: number;
    tags: string[];
    instructor_name: string;
    is_published: boolean;
    display_order: number;
    sections: Section[];
    created_by: string;
    created_at: string;
    updated_at: string;
    enrollment_count?: number;
    avg_rating?: number;
    review_count?: number;
}

export interface Enrollment {
    _id: string;
    user_id: string;
    course_id: string;
    progress: {
        completed_lessons: string[];
        current_lesson_id: string | null;
        percentage: number;
    };
    started_at: string;
    completed_at: string | null;
    course?: Course;
}

export interface CourseReview {
    _id: string;
    user_id: string;
    course_id: string;
    rating: number;
    review_text: string;
    user_name?: string;
    created_at: string;
}

// ── Course CRUD (Admin / Super Admin) ──

export async function createCourse(data: Partial<Course>) {
    try {
        const res = await apiClient.post('/api/courses', data);
        return res.data;
    } catch (error) {
        console.error('Error creating course:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create course' };
    }
}

export async function listCourses() {
    try {
        const res = await apiClient.get('/api/courses');
        return res.data;
    } catch (error) {
        console.error('Error listing courses:', error);
        return { success: false, courses: [], error: error instanceof Error ? error.message : 'Failed to load courses' };
    }
}

export async function getCourse(courseId: string) {
    try {
        const res = await apiClient.get(`/api/courses/${courseId}`);
        return res.data;
    } catch (error) {
        console.error('Error getting course:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load course' };
    }
}

export async function updateCourse(courseId: string, data: Partial<Course>) {
    try {
        const res = await apiClient.patch(`/api/courses/${courseId}`, data);
        return res.data;
    } catch (error) {
        console.error('Error updating course:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update course' };
    }
}

export async function deleteCourse(courseId: string) {
    try {
        const res = await apiClient.delete(`/api/courses/${courseId}`);
        return res.data;
    } catch (error) {
        console.error('Error deleting course:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete course' };
    }
}

export async function togglePublishCourse(courseId: string) {
    try {
        const res = await apiClient.patch(`/api/courses/${courseId}/publish`);
        return res.data;
    } catch (error) {
        console.error('Error publishing course:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to publish course' };
    }
}

// ── Sections & Lessons ──

export async function addSection(courseId: string, title: string) {
    try {
        const res = await apiClient.post(`/api/courses/${courseId}/sections`, { title });
        return res.data;
    } catch (error) {
        console.error('Error adding section:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add section' };
    }
}

export async function addLesson(courseId: string, sectionId: string, lesson: Partial<Lesson>) {
    try {
        const res = await apiClient.post(`/api/courses/${courseId}/sections/${sectionId}/lessons`, lesson);
        return res.data;
    } catch (error) {
        console.error('Error adding lesson:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add lesson' };
    }
}

// ── Enrollment ──

export async function enrollInCourse(courseId: string) {
    try {
        const res = await apiClient.post(`/api/courses/${courseId}/enroll`);
        return res.data;
    } catch (error) {
        console.error('Error enrolling in course:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to enroll in course' };
    }
}

export async function getMyEnrollments(): Promise<{ success: boolean; enrollments: Enrollment[]; error?: string }> {
    try {
        const res = await apiClient.get('/api/enrollments/me');
        return res.data;
    } catch (error) {
        console.error('Error getting enrollments:', error);
        return { success: false, enrollments: [], error: error instanceof Error ? error.message : 'Failed to load enrollments' };
    }
}

export async function completeLesson(courseId: string, lessonId: string) {
    try {
        const res = await apiClient.post(`/api/courses/${courseId}/lessons/${lessonId}/complete`);
        return res.data;
    } catch (error) {
        console.error('Error completing lesson:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to complete lesson' };
    }
}

export async function getCourseProgress(courseId: string) {
    try {
        const res = await apiClient.get(`/api/courses/${courseId}/progress`);
        return res.data;
    } catch (error) {
        console.error('Error getting course progress:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load progress' };
    }
}

// ── Reviews ──

export async function addReview(courseId: string, rating: number, reviewText: string) {
    try {
        const res = await apiClient.post(`/api/courses/${courseId}/reviews`, { rating, review_text: reviewText });
        return res.data;
    } catch (error) {
        console.error('Error adding review:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add review' };
    }
}

export async function getReviews(courseId: string) {
    try {
        const res = await apiClient.get(`/api/courses/${courseId}/reviews`);
        return res.data;
    } catch (error) {
        console.error('Error getting reviews:', error);
        return { success: false, reviews: [], error: error instanceof Error ? error.message : 'Failed to load reviews' };
    }
}

// ── Admin ──

export async function getCourseStats() {
    try {
        const res = await apiClient.get('/api/admin/course-stats');
        return res.data;
    } catch (error) {
        console.error('Error getting course stats:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load statistics' };
    }
}

// ── Industry Prepare Course Creation ──

export async function createIndustryPrepareCourse(thumbnailUrl?: string) {
    const res = await apiClient.post('/api/courses/create-industry-prepare', {
        thumbnail_url: thumbnailUrl || ''
    });
    return res.data;
}

export async function addIndustryModule(courseId: string, moduleData: any) {
    const res = await apiClient.post(`/api/courses/${courseId}/add-industry-module`, {
        module_data: moduleData
    });
    return res.data;
}

export default {
    createCourse,
    listCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    togglePublishCourse,
    addSection,
    addLesson,
    enrollInCourse,
    getMyEnrollments,
    completeLesson,
    getCourseProgress,
    addReview,
    getReviews,
    getCourseStats,
};
