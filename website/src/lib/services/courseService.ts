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
    const res = await apiClient.post('/api/courses', data);
    return res.data;
}

export async function listCourses() {
    const res = await apiClient.get('/api/courses');
    return res.data;
}

export async function getCourse(courseId: string) {
    const res = await apiClient.get(`/api/courses/${courseId}`);
    return res.data;
}

export async function updateCourse(courseId: string, data: Partial<Course>) {
    const res = await apiClient.patch(`/api/courses/${courseId}`, data);
    return res.data;
}

export async function deleteCourse(courseId: string) {
    const res = await apiClient.delete(`/api/courses/${courseId}`);
    return res.data;
}

export async function togglePublishCourse(courseId: string) {
    const res = await apiClient.patch(`/api/courses/${courseId}/publish`);
    return res.data;
}

// ── Sections & Lessons ──

export async function addSection(courseId: string, title: string) {
    const res = await apiClient.post(`/api/courses/${courseId}/sections`, { title });
    return res.data;
}

export async function addLesson(courseId: string, sectionId: string, lesson: Partial<Lesson>) {
    const res = await apiClient.post(`/api/courses/${courseId}/sections/${sectionId}/lessons`, lesson);
    return res.data;
}

// ── Enrollment ──

export async function enrollInCourse(courseId: string) {
    const res = await apiClient.post(`/api/courses/${courseId}/enroll`);
    return res.data;
}

export async function getMyEnrollments(): Promise<{ success: boolean; enrollments: Enrollment[] }> {
    const res = await apiClient.get('/api/enrollments/me');
    return res.data;
}

export async function completeLesson(courseId: string, lessonId: string) {
    const res = await apiClient.post(`/api/courses/${courseId}/lessons/${lessonId}/complete`);
    return res.data;
}

export async function getCourseProgress(courseId: string) {
    const res = await apiClient.get(`/api/courses/${courseId}/progress`);
    return res.data;
}

// ── Reviews ──

export async function addReview(courseId: string, rating: number, reviewText: string) {
    const res = await apiClient.post(`/api/courses/${courseId}/reviews`, { rating, review_text: reviewText });
    return res.data;
}

export async function getReviews(courseId: string) {
    const res = await apiClient.get(`/api/courses/${courseId}/reviews`);
    return res.data;
}

// ── Admin ──

export async function getCourseStats() {
    const res = await apiClient.get('/api/admin/course-stats');
    return res.data;
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
