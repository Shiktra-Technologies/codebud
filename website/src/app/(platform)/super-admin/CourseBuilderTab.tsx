"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronRight,
    GripVertical,
    FileText,
    Video,
    Code2,
    HelpCircle,
    ClipboardList,
    X,
    Save,
    Loader2,
    BarChart3,
    Users as UsersIcon,
    Star,
    GraduationCap,
} from "lucide-react";
import {
    createCourse,
    listCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    togglePublishCourse,
    addSection,
    addLesson,
    getCourseStats,
    createIndustryPrepareCourse,
    addIndustryModule,
} from "@/lib/services/courseService";
import { getAptitudeQuestions } from "@/lib/services/aptitudeService";
import type { Course, Section, Lesson } from "@/lib/services/courseService";

const ease = [0.16, 1, 0.3, 1] as const;

const LESSON_TYPES = [
    { value: "text", label: "Text / Markdown", icon: FileText, color: "text-blue-400" },
    { value: "video", label: "Video", icon: Video, color: "text-purple-400" },
    { value: "code_challenge", label: "Code Challenge", icon: Code2, color: "text-emerald-400" },
    { value: "quiz", label: "Quiz", icon: HelpCircle, color: "text-yellow-400" },
    { value: "assignment", label: "Assignment", icon: ClipboardList, color: "text-orange-400" },
] as const;

const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"] as const;

interface CourseBuilderProps {
    onBack?: () => void;
}

export default function CourseBuilderTab({ onBack }: CourseBuilderProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [view, setView] = useState<"list" | "editor">("list");
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [saving, setSaving] = useState(false);

    // ── Create form state ──
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: "", description: "", difficulty: "beginner", instructor_name: "", estimated_hours: 0, tags: "" });

    const fetchCourses = useCallback(async () => {
        try {
            const [coursesRes, statsRes] = await Promise.all([listCourses(), getCourseStats().catch(() => null)]);
            if (coursesRes.success) setCourses(coursesRes.courses);
            if (statsRes?.success) setStats(statsRes.stats);
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    // ── Create course ──
    const handleCreate = async () => {
        if (!newCourse.title.trim()) return;
        setSaving(true);
        try {
            const res = await createCourse({
                title: newCourse.title,
                description: newCourse.description,
                difficulty: newCourse.difficulty as any,
                instructor_name: newCourse.instructor_name,
                estimated_hours: newCourse.estimated_hours,
                tags: newCourse.tags.split(",").map((t) => t.trim()).filter(Boolean),
            });
            if (res.success) {
                setShowCreateForm(false);
                setNewCourse({ title: "", description: "", difficulty: "beginner", instructor_name: "", estimated_hours: 0, tags: "" });
                fetchCourses();
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to create course");
        }
        setSaving(false);
    };

    // ── Delete course ──
    const handleDelete = async (courseId: string) => {
        if (!confirm("Delete this course permanently?")) return;
        try {
            await deleteCourse(courseId);
            fetchCourses();
        } catch {
            alert("Failed to delete course");
        }
    };

    // ── Toggle publish ──
    const handleTogglePublish = async (courseId: string) => {
        try {
            await togglePublishCourse(courseId);
            fetchCourses();
        } catch {
            alert("Failed to toggle publish status");
        }
    };

    // ── Create Industry Prepare Course ──
    const handleCreateIndustryPrepare = async () => {
        if (!confirm("Create Industry Prepare course? This will add a comprehensive aptitude test course.")) return;
        setSaving(true);
        try {
            // Create the main course
            const createRes = await createIndustryPrepareCourse();
            if (!createRes.success) {
                throw new Error(createRes.error);
            }
            
            console.log("Industry Prepare course created:", createRes.course_id);
            alert("Industry Prepare course created! You can now add modules via the course editor.");
            fetchCourses();
        } catch (err: any) {
            console.error("Failed to create Industry Prepare course:", err);
            alert(err?.response?.data?.error || err.message || "Failed to create Industry Prepare course");
        }
        setSaving(false);
    };

    // ── Add Industry Module ──
    const handleAddIndustryModule = async (courseId: string) => {
        setSaving(true);
        try {
            const questionBank = await getAptitudeQuestions();
            const questions = Array.isArray(questionBank?.questions) ? questionBank.questions : [];

            if (!questionBank?.success || !questions.length) {
                throw new Error(questionBank?.error || "No aptitude questions available in database");
            }

            const moduleData = {
                module_id: "M1",
                title: "Phase 1: Aptitude Questions",
                description: "Loaded from DB question bank",
                questions,
            };

            const res = await addIndustryModule(courseId, moduleData);
            if (!res.success) {
                throw new Error(res.error);
            }
            alert(res.message);
            fetchCourses();
        } catch (err: any) {
            console.error("Failed to add module:", err);
            alert(err?.response?.data?.error || err.message || "Failed to add module");
        }
        setSaving(false);
    };

    // ── Open editor ──
    const openEditor = async (courseId: string) => {
        try {
            const res = await getCourse(courseId);
            if (res.success) {
                setEditingCourse(res.course);
                setView("editor");
            }
        } catch {
            alert("Failed to load course");
        }
    };

    // ── Save full course update ──
    const saveCourse = async (updatedCourse: Course) => {
        setSaving(true);
        try {
            await updateCourse(updatedCourse._id, updatedCourse);
            fetchCourses();
            setView("list");
            setEditingCourse(null);
        } catch {
            alert("Failed to save course");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 size={24} className="mx-auto mb-3 text-white/20 animate-spin" />
                <p className="text-sm text-white/25">Loading courses...</p>
            </div>
        );
    }

    // ══════ EDITOR VIEW ══════
    if (view === "editor" && editingCourse) {
        return (
            <CourseEditor
                course={editingCourse}
                onSave={saveCourse}
                onCancel={() => { setView("list"); setEditingCourse(null); }}
                saving={saving}
                handleAddIndustryModule={handleAddIndustryModule}
            />
        );
    }

    // ══════ LIST VIEW ══════
    return (
        <div>
            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Courses", value: stats.total_courses, icon: BookOpen },
                        { label: "Published", value: stats.published_courses, icon: Eye },
                        { label: "Drafts", value: stats.draft_courses, icon: EyeOff },
                        { label: "Enrollments", value: stats.total_enrollments, icon: UsersIcon },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease }}
                                className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{s.label}</span>
                                    <Icon size={14} className="text-white/15" />
                                </div>
                                <p className="text-xl font-bold text-white">{s.value}</p>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-medium text-white/30">{courses.length} courses</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCreateIndustryPrepare}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-surface-0 text-xs font-bold hover:bg-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GraduationCap size={14} /> 
                        {saving ? "Creating..." : "Industry Prepare"}
                    </button>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors"
                    >
                        <Plus size={14} /> New Course
                    </button>
                </div>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                        <div className="bg-surface-2/50 rounded-xl border border-yellow-400/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">Create New Course</h3>
                                <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/30"><X size={16} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Title *</label>
                                    <input type="text" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="e.g. JavaScript Fundamentals"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Instructor</label>
                                    <input type="text" value={newCourse.instructor_name} onChange={(e) => setNewCourse({ ...newCourse, instructor_name: e.target.value })} placeholder="e.g. John Doe"
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Difficulty</label>
                                    <select value={newCourse.difficulty} onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none focus:border-yellow-400/30 transition-colors cursor-pointer">
                                        {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Est. Hours</label>
                                    <input type="number" value={newCourse.estimated_hours} onChange={(e) => setNewCourse({ ...newCourse, estimated_hours: parseInt(e.target.value) || 0 })} min={0}
                                        className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 outline-none focus:border-yellow-400/30 transition-colors" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Tags (comma-separated)</label>
                                <input type="text" value={newCourse.tags} onChange={(e) => setNewCourse({ ...newCourse, tags: e.target.value })} placeholder="e.g. javascript, web-dev, beginner"
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors" />
                            </div>
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">Description</label>
                                <textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Course description (supports Markdown)..." rows={3}
                                    className="w-full px-3 py-2.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                            </div>
                            <button onClick={handleCreate} disabled={!newCourse.title.trim() || saving}
                                className="px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Course"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Course List */}
            {courses.length === 0 ? (
                <div className="py-20 text-center">
                    <BookOpen size={32} className="mx-auto mb-3 text-white/10" />
                    <h4 className="text-sm font-semibold text-white/30 mb-1">No Courses</h4>
                    <p className="text-xs text-white/15">Create your first course to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {courses.map((course, i) => (
                        <motion.div
                            key={course._id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.04, 0.3), ease }}
                            className="group bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-sm font-semibold text-white truncate">{course.title}</h3>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${course.is_published ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-white/5 text-white/25 border border-white/[0.06]"}`}>
                                            {course.is_published ? "Published" : "Draft"}
                                        </span>
                                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-3/50 text-white/30 border border-white/[0.04]">
                                            {course.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/30 line-clamp-1 mb-2">{course.description || "No description"}</p>
                                    <div className="flex items-center gap-4 text-[11px] text-white/20">
                                        <span>{course.instructor_name || "No instructor"}</span>
                                        <span>{course.sections?.length || 0} sections</span>
                                        <span>{course.sections?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0} lessons</span>
                                        {course.enrollment_count !== undefined && <span className="flex items-center gap-1"><UsersIcon size={10} />{course.enrollment_count} enrolled</span>}
                                        {(course.avg_rating || 0) > 0 && <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400" />{course.avg_rating}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleTogglePublish(course._id)} title={course.is_published ? "Unpublish" : "Publish"}
                                        className="p-2 rounded-lg text-white/20 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors">
                                        {course.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button onClick={() => openEditor(course._id)} title="Edit"
                                        className="p-2 rounded-lg text-white/20 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(course._id)} title="Delete"
                                        className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════
//                     COURSE EDITOR
// ══════════════════════════════════════════════════════════════

interface CourseEditorProps {
    course: Course;
    onSave: (course: Course) => void;
    onCancel: () => void;
    saving: boolean;
    handleAddIndustryModule?: (courseId: string) => Promise<void>;
}

function CourseEditor({ course: initialCourse, onSave, onCancel, saving, handleAddIndustryModule }: CourseEditorProps) {
    const [course, setCourse] = useState<Course>({ ...initialCourse });
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [editingLesson, setEditingLesson] = useState<{ sectionId: string; lesson: Lesson } | null>(null);

    const updateField = (field: string, value: any) => {
        setCourse((prev) => ({ ...prev, [field]: value }));
    };

    // ── Section management ──
    const handleAddSection = () => {
        const newSection: Section = {
            _id: `sec_${Date.now()}`,
            title: "New Section",
            order: course.sections.length,
            lessons: [],
        };
        setCourse((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
        setExpandedSections((prev) => new Set(prev).add(newSection._id));
    };

    const updateSectionTitle = (sectionId: string, title: string) => {
        setCourse((prev) => ({
            ...prev,
            sections: prev.sections.map((s) => s._id === sectionId ? { ...s, title } : s),
        }));
    };

    const removeSection = (sectionId: string) => {
        if (!confirm("Delete this section and all its lessons?")) return;
        setCourse((prev) => ({
            ...prev,
            sections: prev.sections.filter((s) => s._id !== sectionId),
        }));
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= course.sections.length) return;
        const sections = [...course.sections];
        [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
        sections.forEach((s, i) => (s.order = i));
        setCourse((prev) => ({ ...prev, sections }));
    };

    // ── Lesson management ──
    const handleAddLesson = (sectionId: string, type: string = "text") => {
        const newLesson: Lesson = {
            _id: `les_${Date.now()}`,
            title: "New Lesson",
            type: type as any,
            content: "",
            duration_minutes: 0,
            order: 0,
        };
        setCourse((prev) => ({
            ...prev,
            sections: prev.sections.map((s) => {
                if (s._id === sectionId) {
                    newLesson.order = s.lessons.length;
                    return { ...s, lessons: [...s.lessons, newLesson] };
                }
                return s;
            }),
        }));
        setEditingLesson({ sectionId, lesson: newLesson });
    };

    const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
        setCourse((prev) => ({
            ...prev,
            sections: prev.sections.map((s) => {
                if (s._id === sectionId) {
                    return {
                        ...s,
                        lessons: s.lessons.map((l) => l._id === lessonId ? { ...l, ...updates } : l),
                    };
                }
                return s;
            }),
        }));
    };

    const removeLesson = (sectionId: string, lessonId: string) => {
        setCourse((prev) => ({
            ...prev,
            sections: prev.sections.map((s) => {
                if (s._id === sectionId) {
                    return { ...s, lessons: s.lessons.filter((l) => l._id !== lessonId) };
                }
                return s;
            }),
        }));
        if (editingLesson?.lesson._id === lessonId) setEditingLesson(null);
    };

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const getLessonTypeInfo = (type: string) => LESSON_TYPES.find((t) => t.value === type) || LESSON_TYPES[0];

    return (
        <div>
            {/* Editor Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onCancel} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                    <ChevronRight size={14} className="rotate-180" /> Back to courses
                </button>
                <button
                    onClick={() => onSave(course)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 text-surface-0 text-xs font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Course"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Metadata */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Course Details</h3>
                        {[
                            { label: "Title", key: "title", type: "text" },
                            { label: "Instructor", key: "instructor_name", type: "text" },
                            { label: "Est. Hours", key: "estimated_hours", type: "number" },
                        ].map((field) => (
                            <div key={field.key}>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mb-1 block">{field.label}</label>
                                <input
                                    type={field.type}
                                    value={(course as any)[field.key] || ""}
                                    onChange={(e) => updateField(field.key, field.type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/70 outline-none focus:border-yellow-400/30 transition-colors"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mb-1 block">Difficulty</label>
                            <select value={course.difficulty} onChange={(e) => updateField("difficulty", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                                {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mb-1 block">Description</label>
                            <textarea value={course.description} onChange={(e) => updateField("description", e.target.value)} rows={4}
                                className="w-full px-3 py-2 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/70 outline-none focus:border-yellow-400/30 transition-colors resize-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mb-1 block">Tags</label>
                            <input type="text" value={course.tags?.join(", ") || ""} onChange={(e) => updateField("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                                className="w-full px-3 py-2 rounded-lg bg-surface-3/50 border border-white/[0.06] text-sm text-white/70 outline-none focus:border-yellow-400/30 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Right: Sections & Lessons */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/30">Sections & Lessons</h3>
                        <div className="flex items-center gap-2">
                            {/* Special button for Industry Prepare course */}
                            {course.title.toLowerCase().includes('industry prepare') && (
                                <button 
                                    onClick={() => handleAddIndustryModule && handleAddIndustryModule(course._id)}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/20 border border-emerald-400/30 text-xs text-emerald-400 hover:bg-emerald-400/30 transition-all disabled:opacity-50"
                                >
                                    <GraduationCap size={12} /> Add Phase 1 Module
                                </button>
                            )}
                            <button onClick={handleAddSection}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3/50 border border-white/[0.06] text-xs text-white/40 hover:text-white/60 hover:border-white/10 transition-all">
                                <Plus size={12} /> Add Section
                            </button>
                        </div>
                    </div>

                    {course.sections.length === 0 ? (
                        <div className="py-16 text-center bg-surface-2/30 rounded-xl border border-dashed border-white/[0.08]">
                            <BookOpen size={24} className="mx-auto mb-2 text-white/10" />
                            <p className="text-xs text-white/20">No sections yet. Add a section to start building your course.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {course.sections.map((section, sIdx) => {
                                const isExpanded = expandedSections.has(section._id);
                                return (
                                    <div key={section._id} className="bg-surface-2/50 rounded-xl border border-white/[0.06] overflow-hidden">
                                        {/* Section Header */}
                                        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => toggleSection(section._id)}>
                                            <div className="flex items-center gap-1 text-white/15">
                                                <button onClick={(e) => { e.stopPropagation(); moveSection(sIdx, -1); }} disabled={sIdx === 0} className="p-0.5 hover:text-white/40 disabled:opacity-30"><ChevronDown size={12} className="rotate-180" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); moveSection(sIdx, 1); }} disabled={sIdx === course.sections.length - 1} className="p-0.5 hover:text-white/40 disabled:opacity-30"><ChevronDown size={12} /></button>
                                            </div>
                                            <ChevronRight size={14} className={`text-white/20 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSectionTitle(section._id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 bg-transparent text-sm font-semibold text-white outline-none focus:text-yellow-400 transition-colors"
                                            />
                                            <span className="text-[10px] text-white/15">{section.lessons.length} lessons</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeSection(section._id); }}
                                                className="p-1.5 rounded text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        {/* Lessons */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-2">
                                                        {section.lessons.map((lesson) => {
                                                            const typeInfo = getLessonTypeInfo(lesson.type);
                                                            const TypeIcon = typeInfo.icon;
                                                            const isEditing = editingLesson?.lesson._id === lesson._id;
                                                            return (
                                                                <div key={lesson._id}>
                                                                    <div
                                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${isEditing ? "bg-yellow-400/5 border-yellow-400/20" : "bg-surface-3/30 border-white/[0.04] hover:border-white/[0.08]"}`}
                                                                        onClick={() => setEditingLesson({ sectionId: section._id, lesson })}
                                                                    >
                                                                        <TypeIcon size={14} className={typeInfo.color} />
                                                                        <span className="flex-1 text-xs font-medium text-white/60 truncate">{lesson.title}</span>
                                                                        <span className="text-[10px] text-white/15">{typeInfo.label}</span>
                                                                        {lesson.duration_minutes > 0 && <span className="text-[10px] text-white/15">{lesson.duration_minutes}m</span>}
                                                                        <button onClick={(e) => { e.stopPropagation(); removeLesson(section._id, lesson._id); }}
                                                                            className="p-1 rounded text-white/10 hover:text-red-400 transition-colors">
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                    {/* Inline Lesson Editor */}
                                                                    <AnimatePresence>
                                                                        {isEditing && (
                                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                                                <div className="mt-2 p-4 bg-surface-3/30 rounded-lg border border-white/[0.04] space-y-3">
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        <div>
                                                                                            <label className="text-[10px] font-semibold uppercase text-white/20 mb-1 block">Lesson Title</label>
                                                                                            <input type="text" value={lesson.title} onChange={(e) => updateLesson(section._id, lesson._id, { title: e.target.value })}
                                                                                                className="w-full px-3 py-2 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/70 outline-none focus:border-yellow-400/30" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-[10px] font-semibold uppercase text-white/20 mb-1 block">Type</label>
                                                                                            <select value={lesson.type} onChange={(e) => updateLesson(section._id, lesson._id, { type: e.target.value as any })}
                                                                                                className="w-full px-3 py-2 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer">
                                                                                                {LESSON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                                                            </select>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] font-semibold uppercase text-white/20 mb-1 block">Duration (minutes)</label>
                                                                                        <input type="number" value={lesson.duration_minutes} onChange={(e) => updateLesson(section._id, lesson._id, { duration_minutes: parseInt(e.target.value) || 0 })} min={0}
                                                                                            className="w-32 px-3 py-2 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/70 outline-none focus:border-yellow-400/30" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] font-semibold uppercase text-white/20 mb-1 block">
                                                                                            {lesson.type === "video" ? "Video URL" : lesson.type === "quiz" ? "Quiz JSON" : lesson.type === "code_challenge" ? "Problem / Instructions (Markdown)" : "Content (Markdown)"}
                                                                                        </label>
                                                                                        <textarea
                                                                                            value={lesson.content}
                                                                                            onChange={(e) => updateLesson(section._id, lesson._id, { content: e.target.value })}
                                                                                            rows={lesson.type === "video" ? 2 : 8}
                                                                                            placeholder={lesson.type === "video" ? "https://youtube.com/embed/..." : lesson.type === "quiz" ? '[\n  { "question": "...", "options": ["A","B","C","D"], "correct": 0 }\n]' : "Write your content in Markdown..."}
                                                                                            className="w-full px-3 py-2 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/70 outline-none focus:border-yellow-400/30 transition-colors resize-none font-mono"
                                                                                        />
                                                                                    </div>
                                                                                    <button onClick={() => setEditingLesson(null)}
                                                                                        className="px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs font-semibold text-yellow-400 hover:bg-yellow-400/20 transition-colors">
                                                                                        Done Editing
                                                                                    </button>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Add Lesson Buttons */}
                                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                                                            <span className="text-[10px] text-white/15 mr-1">Add:</span>
                                                            {LESSON_TYPES.map((t) => {
                                                                const Icon = t.icon;
                                                                return (
                                                                    <button key={t.value} onClick={() => handleAddLesson(section._id, t.value)}
                                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-3/50 border border-white/[0.04] text-[10px] text-white/25 hover:text-white/50 hover:border-white/[0.08] transition-all"
                                                                        title={`Add ${t.label}`}>
                                                                        <Icon size={10} className={t.color} /> {t.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
