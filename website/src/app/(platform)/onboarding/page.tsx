"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { defaultRouteForRole } from "@/lib/auth/roleRouting";
import {
    getOnboardingConfig,
    completeOnboarding,
    getOnboardingData,
    type OnboardingConfig,
    type OnboardingProfile,
    type OnboardingEducation,
    type OnboardingSkills,
    type OnboardingCareer,
} from "@/lib/services/onboardingService";
import {
    User,
    GraduationCap,
    Code2,
    Target,
    Camera,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Sparkles,
    Search,
    X,
    Github,
    Linkedin,
    Globe,
    Phone,
    MapPin,
    Calendar,
    BookOpen,
} from "lucide-react";

// ─── Motion presets ────────────────────────────────────────────────────────────

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const STEPS = [
    { id: 1, label: "Basic Info", icon: User },
    { id: 2, label: "Education", icon: GraduationCap },
    { id: 3, label: "Skills", icon: Code2 },
    { id: 4, label: "Goals", icon: Target },
    { id: 5, label: "Profile", icon: Camera },
    { id: 6, label: "Summary", icon: CheckCircle2 },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const { user, refreshMe } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [config, setConfig] = useState<OnboardingConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // ── Form state ──
    const [profile, setProfile] = useState<OnboardingProfile>({
        display_name: "",
        phone: "",
        dob: "",
        gender: "",
        city: "",
        bio: "",
        linkedin: "",
        github: "",
        portfolio: "",
    });
    const [education, setEducation] = useState<OnboardingEducation>({
        status: "",
        college: "",
        degree: "",
        branch: "",
        year: "",
        graduation_year: "",
        cgpa: "",
    });
    const [skills, setSkills] = useState<OnboardingSkills>({
        languages: [],
        frameworks: [],
        interests: [],
        skill_level: "",
    });
    const [career, setCareer] = useState<OnboardingCareer>({
        goals: [],
        dream_companies: [],
        preferred_roles: [],
        weekly_hours: "",
    });

    // ── Load config + existing data ──
    useEffect(() => {
        (async () => {
            try {
                const [configRes, dataRes] = await Promise.all([
                    getOnboardingConfig(),
                    getOnboardingData().catch(() => null),
                ]);
                if (configRes.success) setConfig(configRes.config);

                // Pre-fill if editing
                if (dataRes?.success && dataRes.data) {
                    const d = dataRes.data;
                    if (dataRes.onboarding_completed) setEditMode(true);
                    if (d.profile) {
                        setProfile((prev) => ({
                            ...prev,
                            ...d.profile,
                            display_name: d.profile.display_name || (user as any)?.display_name || prev.display_name,
                        }));
                    }
                    if (d.education && Object.keys(d.education).length > 0) setEducation((prev) => ({ ...prev, ...d.education }));
                    if (d.skills && Object.keys(d.skills).length > 0) setSkills((prev) => ({ ...prev, ...d.skills }));
                    if (d.career && Object.keys(d.career).length > 0) setCareer((prev) => ({ ...prev, ...d.career }));
                } else {
                    // First time — pre-fill name from user
                    setProfile((prev) => ({
                        ...prev,
                        display_name: (user as any)?.display_name || (user as any)?.displayName || user?.email?.split("@")[0] || "",
                    }));
                }
            } catch (err) {
                console.error("Failed to load onboarding config:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    // ── Navigation ──
    const goNext = useCallback(() => {
        if (step < 6) {
            setDirection(1);
            setStep((s) => s + 1);
        }
    }, [step]);

    const goPrev = useCallback(() => {
        if (step > 1) {
            setDirection(-1);
            setStep((s) => s - 1);
        }
    }, [step]);

    const goToStep = useCallback(
        (s: number) => {
            setDirection(s > step ? 1 : -1);
            setStep(s);
        },
        [step],
    );

    // ── Step validation ──
    const isStepValid = (s: number): boolean => {
        switch (s) {
            case 1:
                return !!profile.display_name.trim() && !!profile.city.trim();
            case 2:
                return !!education.status && !!education.college.trim();
            case 3:
                return (
                    skills.languages.length > 0 &&
                    skills.interests.length > 0 &&
                    !!skills.skill_level
                );
            case 4:
                return career.goals.length > 0;
            default:
                return true;
        }
    };

    const allValid = isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);

    const getPostOnboardingRoute = useCallback((roleOverride?: string) => {
        const role = roleOverride || (user as any)?.role;
        // Students: first-time completion gets the cinematic reveal experience.
        // Edit-mode (already onboarded) goes straight back to the dashboard.
        if (role === "student" && !editMode) {
            return "/generating-path?next=/learning-path";
        }
        return defaultRouteForRole(role);
    }, [user, editMode]);

    // ── Submit ──
    const handleSubmit = async () => {
        if (!allValid) return;
        setSubmitting(true);
        try {
            const res = await completeOnboarding({ profile, education, skills, career });
            if (res.success) {
                const refreshed = await refreshMe();
                if (!refreshed.success || !refreshed.user) {
                    throw new Error(refreshed.error || "Failed to refresh profile after onboarding");
                }
                // Small delay for the animation to settle
                setTimeout(() => router.replace(getPostOnboardingRoute((refreshed.user as any)?.role)), 500);
                return;
            }

            throw new Error(res?.error || "Failed to complete onboarding");
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed to complete onboarding");
            setSubmitting(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-yellow-400" />
                    <p className="text-sm text-white/30">Setting things up...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col">
            {/* ── Top Bar ── */}
            <header className="sticky top-0 z-50 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
                            <Sparkles size={16} className="text-surface-0" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">
                                {editMode ? "Edit Your Profile" : "Welcome to CodeBud"}
                            </h1>
                            <p className="text-[10px] text-white/25">
                                {editMode ? "Update your information" : "Let\u2019s set up your profile in 2 minutes"}
                            </p>
                        </div>
                    </div>
                    {editMode && (
                        <button onClick={() => router.back()} className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                            <X size={14} /> Cancel
                        </button>
                    )}
                </div>
            </header>

            {/* ── Progress Steps ── */}
            <div className="max-w-3xl mx-auto px-6 pt-6 pb-2 w-full">
                <div className="flex items-center justify-between mb-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isCurrent = s.id === step;
                        const isCompleted = s.id < step;
                        const isValid = isStepValid(s.id);
                        return (
                            <React.Fragment key={s.id}>
                                <button
                                    onClick={() => goToStep(s.id)}
                                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isCurrent ? "scale-110" : "scale-100"}`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                                            isCurrent
                                                ? "bg-yellow-400 border-yellow-400 text-surface-0 shadow-lg shadow-yellow-400/20"
                                                : isCompleted && isValid
                                                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
                                                  : "bg-surface-2/50 border-white/[0.06] text-white/20"
                                        }`}
                                    >
                                        {isCompleted && isValid ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                    </div>
                                    <span
                                        className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                                            isCurrent ? "text-yellow-400" : isCompleted && isValid ? "text-emerald-400/60" : "text-white/15"
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className="flex-1 mx-2 mt-[-18px]">
                                        <div className="h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                className="h-full bg-yellow-400/40"
                                                initial={{ width: "0%" }}
                                                animate={{ width: isCompleted ? "100%" : "0%" }}
                                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                {/* Overall progress bar */}
                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-4">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                        animate={{ width: `${((step - 1) / 5) * 100}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>
            </div>

            {/* ── Step Content ── */}
            <main className="flex-1 max-w-3xl mx-auto px-6 py-8 w-full">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {step === 1 && (
                            <Step1BasicInfo profile={profile} setProfile={setProfile} />
                        )}
                        {step === 2 && (
                            <Step2Education education={education} setEducation={setEducation} config={config} />
                        )}
                        {step === 3 && (
                            <Step3Skills skills={skills} setSkills={setSkills} config={config} />
                        )}
                        {step === 4 && (
                            <Step4Goals career={career} setCareer={setCareer} config={config} />
                        )}
                        {step === 5 && (
                            <Step5Profile profile={profile} setProfile={setProfile} />
                        )}
                        {step === 6 && (
                            <Step6Summary profile={profile} education={education} skills={skills} career={career} onEdit={goToStep} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ── Bottom Nav ── */}
            <footer className="sticky bottom-0 bg-surface-0/80 backdrop-blur-xl border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={goPrev}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>

                    <span className="text-[10px] font-semibold text-white/15 uppercase tracking-widest">
                        Step {step} of 6
                    </span>

                    {step < 6 ? (
                        <button
                            onClick={goNext}
                            disabled={!isStepValid(step)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                isStepValid(step)
                                    ? "bg-yellow-400 text-surface-0 hover:bg-yellow-300 shadow-lg shadow-yellow-400/10"
                                    : "bg-white/[0.04] text-white/15 cursor-not-allowed"
                            }`}
                        >
                            Continue <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!allValid || submitting}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                allValid && !submitting
                                    ? "bg-emerald-400 text-surface-0 hover:bg-emerald-300 shadow-lg shadow-emerald-400/10 animate-pulse"
                                    : "bg-white/[0.04] text-white/15 cursor-not-allowed"
                            }`}
                        >
                            {submitting ? (
                                <><Loader2 size={14} className="animate-spin" /> Saving...</>
                            ) : (
                                <>{editMode ? "Save Changes" : "Complete Setup"} <CheckCircle2 size={14} /></>
                            )}
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
//                           STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════


// ── Helper: Section label ──
function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h2 className="text-lg font-bold text-white mb-1">{children}</h2>;
}
function SectionDesc({ children }: { children: React.ReactNode }) {
    return <p className="text-xs text-white/25 mb-6">{children}</p>;
}
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1.5 block">
            {children} {required && <span className="text-yellow-400">*</span>}
        </label>
    );
}
function InputField({
    value,
    onChange,
    placeholder,
    type = "text",
    icon: Icon,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    type?: string;
    icon?: React.ElementType;
}) {
    return (
        <div className="relative">
            {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-yellow-400/30 transition-colors`}
            />
        </div>
    );
}


// ═══════ STEP 1: Basic Info ═══════

function Step1BasicInfo({
    profile,
    setProfile,
}: {
    profile: OnboardingProfile;
    setProfile: React.Dispatch<React.SetStateAction<OnboardingProfile>>;
}) {
    const set = (key: keyof OnboardingProfile, val: string) => setProfile((p) => ({ ...p, [key]: val }));

    return (
        <div>
            <SectionLabel>Tell us about yourself</SectionLabel>
            <SectionDesc>This helps us personalize your experience. Required fields are marked with *.</SectionDesc>

            <div className="space-y-4">
                <div>
                    <FieldLabel required>Display Name</FieldLabel>
                    <InputField value={profile.display_name} onChange={(v) => set("display_name", v)} placeholder="What should we call you?" icon={User} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <FieldLabel>Phone Number</FieldLabel>
                        <InputField value={profile.phone} onChange={(v) => set("phone", v)} placeholder="+91 98765 43210" icon={Phone} />
                    </div>
                    <div>
                        <FieldLabel>Date of Birth</FieldLabel>
                        <InputField value={profile.dob} onChange={(v) => set("dob", v)} placeholder="" type="date" icon={Calendar} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <FieldLabel>Gender</FieldLabel>
                        <select
                            value={profile.gender}
                            onChange={(e) => set("gender", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer focus:border-yellow-400/30 transition-colors"
                        >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>City / Location</FieldLabel>
                        <InputField value={profile.city} onChange={(v) => set("city", v)} placeholder="e.g. Bangalore, India" icon={MapPin} />
                    </div>
                </div>
            </div>
        </div>
    );
}


// ═══════ STEP 2: Education ═══════

function Step2Education({
    education,
    setEducation,
    config,
}: {
    education: OnboardingEducation;
    setEducation: React.Dispatch<React.SetStateAction<OnboardingEducation>>;
    config: OnboardingConfig | null;
}) {
    const set = (key: keyof OnboardingEducation, val: string) => setEducation((e) => ({ ...e, [key]: val }));
    const [collegeSearch, setCollegeSearch] = useState("");

    const colleges = config?.colleges || [];
    const filteredColleges = collegeSearch.trim()
        ? colleges.filter((c) => c.toLowerCase().includes(collegeSearch.toLowerCase()))
        : [];

    return (
        <div>
            <SectionLabel>Education Details</SectionLabel>
            <SectionDesc>Tell us about your academic background.</SectionDesc>

            <div className="space-y-4">
                <div>
                    <FieldLabel required>Current Status</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                        {["Student", "Graduate", "Working Professional"].map((s) => (
                            <button
                                key={s}
                                onClick={() => set("status", s.toLowerCase().replace(" ", "_"))}
                                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                                    education.status === s.toLowerCase().replace(" ", "_")
                                        ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                        : "bg-surface-2/50 border-white/[0.06] text-white/30 hover:border-white/[0.12] hover:text-white/50"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <FieldLabel required>College / University</FieldLabel>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
                        <input
                            type="text"
                            value={education.college || collegeSearch}
                            onChange={(e) => {
                                setCollegeSearch(e.target.value);
                                set("college", e.target.value);
                            }}
                            placeholder="Search your college..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-yellow-400/30 transition-colors"
                        />
                        {filteredColleges.length > 0 && collegeSearch.trim() && (
                            <div className="absolute z-10 top-full mt-1 w-full max-h-40 overflow-y-auto rounded-lg bg-surface-2 border border-white/[0.08] shadow-xl">
                                {filteredColleges.slice(0, 8).map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            set("college", c);
                                            setCollegeSearch("");
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-white/60 hover:bg-yellow-400/10 hover:text-yellow-400 transition-colors"
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <FieldLabel>Degree</FieldLabel>
                        <select
                            value={education.degree}
                            onChange={(e) => set("degree", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer focus:border-yellow-400/30 transition-colors"
                        >
                            <option value="">Select degree</option>
                            {(config?.degrees || []).map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Branch / Specialization</FieldLabel>
                        <select
                            value={education.branch}
                            onChange={(e) => set("branch", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer focus:border-yellow-400/30 transition-colors"
                        >
                            <option value="">Select branch</option>
                            {(config?.branches || []).map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <FieldLabel>Year of Study</FieldLabel>
                        <select
                            value={education.year}
                            onChange={(e) => set("year", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer focus:border-yellow-400/30 transition-colors"
                        >
                            <option value="">Select</option>
                            {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduated"].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Graduation Year</FieldLabel>
                        <select
                            value={education.graduation_year}
                            onChange={(e) => set("graduation_year", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/60 outline-none cursor-pointer focus:border-yellow-400/30 transition-colors"
                        >
                            <option value="">Select</option>
                            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                                <option key={y} value={String(y)}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>CGPA / %</FieldLabel>
                        <InputField value={education.cgpa} onChange={(v) => set("cgpa", v)} placeholder="e.g. 8.5" />
                    </div>
                </div>
            </div>
        </div>
    );
}


// ═══════ STEP 3: Skills & Interests ═══════

function ChipSelector({
    label,
    options,
    selected,
    onToggle,
    placeholder = "Search...",
}: {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (val: string) => void;
    placeholder?: string;
}) {
    const [search, setSearch] = useState("");
    const filtered = search.trim()
        ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
        : options;

    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selected.map((s) => (
                        <motion.button
                            key={s}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={() => onToggle(s)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors"
                        >
                            {s} <X size={10} />
                        </motion.button>
                    ))}
                </div>
            )}
            {/* Search */}
            <div className="relative mb-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/15" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-2/30 border border-white/[0.04] text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-yellow-400/20 transition-colors"
                />
            </div>
            {/* Options grid */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filtered.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => onToggle(opt)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                                isSelected
                                    ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                                    : "bg-surface-2/30 text-white/30 border-white/[0.04] hover:border-white/[0.1] hover:text-white/50"
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Step3Skills({
    skills,
    setSkills,
    config,
}: {
    skills: OnboardingSkills;
    setSkills: React.Dispatch<React.SetStateAction<OnboardingSkills>>;
    config: OnboardingConfig | null;
}) {
    const toggleLang = (lang: string) => {
        setSkills((prev) => {
            const existing = prev.languages.find((l) => l.name === lang);
            if (existing) {
                return { ...prev, languages: prev.languages.filter((l) => l.name !== lang) };
            }
            return { ...prev, languages: [...prev.languages, { name: lang, level: "beginner" }] };
        });
    };

    const setLevel = (lang: string, level: string) => {
        setSkills((prev) => ({
            ...prev,
            languages: prev.languages.map((l) => (l.name === lang ? { ...l, level } : l)),
        }));
    };

    const toggleFramework = (fw: string) => {
        setSkills((prev) => ({
            ...prev,
            frameworks: prev.frameworks.includes(fw) ? prev.frameworks.filter((f) => f !== fw) : [...prev.frameworks, fw],
        }));
    };

    const toggleInterest = (topic: string) => {
        setSkills((prev) => ({
            ...prev,
            interests: prev.interests.includes(topic) ? prev.interests.filter((t) => t !== topic) : [...prev.interests, topic],
        }));
    };

    const SKILL_LEVELS: { value: string; label: string; hint: string }[] = [
        { value: "1", label: "Beginner", hint: "Just starting out" },
        { value: "2", label: "Intermediate", hint: "Comfortable building things" },
        { value: "3", label: "Advanced", hint: "Strong fundamentals + projects" },
    ];

    return (
        <div>
            <SectionLabel>Skills & Interests</SectionLabel>
            <SectionDesc>Pick your languages, tools, and topics you&apos;re interested in. At least 1 language, 1 interest, and your overall level required.</SectionDesc>

            <div className="space-y-6">
                {/* Overall skill level — feeds the recommendation engine */}
                <div>
                    <FieldLabel required>Overall coding experience</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                        {SKILL_LEVELS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setSkills((prev) => ({ ...prev, skill_level: opt.value }))}
                                className={`px-3 py-2.5 rounded-lg text-left border transition-all ${
                                    skills.skill_level === opt.value
                                        ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                        : "bg-surface-2/50 border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60"
                                }`}
                            >
                                <div className="text-xs font-bold">{opt.label}</div>
                                <div className="text-[10px] mt-0.5 opacity-70">{opt.hint}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div>
                    <ChipSelector
                        label="Programming Languages *"
                        options={config?.programming_languages || []}
                        selected={skills.languages.map((l) => l.name)}
                        onToggle={toggleLang}
                        placeholder="Search languages..."
                    />
                    {/* Skill level selectors for selected langs */}
                    {skills.languages.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {skills.languages.map((lang) => (
                                <div key={lang.name} className="flex items-center gap-3 bg-surface-2/30 rounded-lg px-3 py-2 border border-white/[0.04]">
                                    <span className="text-xs font-semibold text-yellow-400 w-24 truncate">{lang.name}</span>
                                    <div className="flex gap-1.5">
                                        {["beginner", "intermediate", "advanced"].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setLevel(lang.name, level)}
                                                className={`px-2 py-1 rounded text-[10px] font-semibold capitalize border transition-all ${
                                                    lang.level === level
                                                        ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                                                        : "text-white/20 border-white/[0.04] hover:text-white/40"
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Frameworks */}
                <ChipSelector
                    label="Frameworks & Tools"
                    options={config?.frameworks || []}
                    selected={skills.frameworks}
                    onToggle={toggleFramework}
                    placeholder="Search frameworks..."
                />

                {/* Interests */}
                <ChipSelector
                    label="Topics of Interest *"
                    options={config?.interest_topics || []}
                    selected={skills.interests}
                    onToggle={toggleInterest}
                    placeholder="Search topics..."
                />
            </div>
        </div>
    );
}


// ═══════ STEP 4: Career Goals ═══════

function Step4Goals({
    career,
    setCareer,
    config,
}: {
    career: OnboardingCareer;
    setCareer: React.Dispatch<React.SetStateAction<OnboardingCareer>>;
    config: OnboardingConfig | null;
}) {
    const toggleGoal = (g: string) => {
        setCareer((prev) => ({
            ...prev,
            goals: prev.goals.includes(g) ? prev.goals.filter((x) => x !== g) : [...prev.goals, g],
        }));
    };
    const toggleCompany = (c: string) => {
        setCareer((prev) => ({
            ...prev,
            dream_companies: prev.dream_companies.includes(c) ? prev.dream_companies.filter((x) => x !== c) : [...prev.dream_companies, c],
        }));
    };
    const toggleRole = (r: string) => {
        setCareer((prev) => ({
            ...prev,
            preferred_roles: prev.preferred_roles.includes(r) ? prev.preferred_roles.filter((x) => x !== r) : [...prev.preferred_roles, r],
        }));
    };

    return (
        <div>
            <SectionLabel>Career Goals</SectionLabel>
            <SectionDesc>What are you working towards? This helps us recommend the right content. At least 1 goal required.</SectionDesc>

            <div className="space-y-6">
                <ChipSelector
                    label="What brings you here? *"
                    options={config?.career_goals || []}
                    selected={career.goals}
                    onToggle={toggleGoal}
                    placeholder="Search goals..."
                />

                <ChipSelector
                    label="Dream Companies"
                    options={config?.dream_companies || []}
                    selected={career.dream_companies}
                    onToggle={toggleCompany}
                    placeholder="Search companies..."
                />

                <ChipSelector
                    label="Preferred Job Roles"
                    options={config?.job_roles || []}
                    selected={career.preferred_roles}
                    onToggle={toggleRole}
                    placeholder="Search roles..."
                />

                <div>
                    <FieldLabel>Available hours per week for practice</FieldLabel>
                    <div className="grid grid-cols-4 gap-2">
                        {["< 5h", "5-10h", "10-20h", "20h+"].map((h) => (
                            <button
                                key={h}
                                onClick={() => setCareer((prev) => ({ ...prev, weekly_hours: h }))}
                                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                                    career.weekly_hours === h
                                        ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                                        : "bg-surface-2/50 border-white/[0.06] text-white/30 hover:border-white/[0.12]"
                                }`}
                            >
                                {h}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


// ═══════ STEP 5: Profile Links ═══════

function Step5Profile({
    profile,
    setProfile,
}: {
    profile: OnboardingProfile;
    setProfile: React.Dispatch<React.SetStateAction<OnboardingProfile>>;
}) {
    const set = (key: keyof OnboardingProfile, val: string) => setProfile((p) => ({ ...p, [key]: val }));

    return (
        <div>
            <SectionLabel>Almost there!</SectionLabel>
            <SectionDesc>Add a short bio and your social links. All optional — you can update these later.</SectionDesc>

            <div className="space-y-4">
                <div>
                    <FieldLabel>Short Bio</FieldLabel>
                    <div className="relative">
                        <textarea
                            value={profile.bio}
                            onChange={(e) => set("bio", e.target.value.slice(0, 200))}
                            placeholder="Tell us a bit about yourself..."
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg bg-surface-2/50 border border-white/[0.06] text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-yellow-400/30 transition-colors resize-none"
                        />
                        <span className="absolute bottom-2 right-3 text-[10px] text-white/15">{profile.bio.length}/200</span>
                    </div>
                </div>

                <div>
                    <FieldLabel>LinkedIn</FieldLabel>
                    <InputField value={profile.linkedin} onChange={(v) => set("linkedin", v)} placeholder="https://linkedin.com/in/..." icon={Linkedin} />
                </div>

                <div>
                    <FieldLabel>GitHub</FieldLabel>
                    <InputField value={profile.github} onChange={(v) => set("github", v)} placeholder="https://github.com/..." icon={Github} />
                </div>

                <div>
                    <FieldLabel>Portfolio / Website</FieldLabel>
                    <InputField value={profile.portfolio} onChange={(v) => set("portfolio", v)} placeholder="https://..." icon={Globe} />
                </div>
            </div>
        </div>
    );
}


// ═══════ STEP 6: Summary ═══════

function SummarySection({ title, icon: Icon, onEdit, children }: { title: string; icon: React.ElementType; onEdit: () => void; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-2/50 rounded-xl border border-white/[0.06] p-5 relative group"
        >
            <button
                onClick={onEdit}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/15 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all opacity-0 group-hover:opacity-100"
                title="Edit this section"
            >
                <BookOpen size={12} />
            </button>
            <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className="text-yellow-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

function Step6Summary({
    profile,
    education,
    skills,
    career,
    onEdit,
}: {
    profile: OnboardingProfile;
    education: OnboardingEducation;
    skills: OnboardingSkills;
    career: OnboardingCareer;
    onEdit: (step: number) => void;
}) {
    return (
        <div>
            <SectionLabel>Review & Confirm</SectionLabel>
            <SectionDesc>Here&apos;s a summary of your profile. Click any section to edit.</SectionDesc>

            <div className="space-y-4">
                {/* Profile */}
                <SummarySection title="Basic Info" icon={User} onEdit={() => onEdit(1)}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <p className="text-sm text-white font-semibold col-span-2 mb-1">{profile.display_name}</p>
                        {profile.city && <p className="text-xs text-white/30"><MapPin size={10} className="inline mr-1" />{profile.city}</p>}
                        {profile.phone && <p className="text-xs text-white/30"><Phone size={10} className="inline mr-1" />{profile.phone}</p>}
                        {profile.gender && <p className="text-xs text-white/30 capitalize">{profile.gender.replace("_", " ")}</p>}
                    </div>
                </SummarySection>

                {/* Education */}
                <SummarySection title="Education" icon={GraduationCap} onEdit={() => onEdit(2)}>
                    <div className="space-y-1">
                        <p className="text-sm text-white font-semibold">{education.college || "—"}</p>
                        <p className="text-xs text-white/30">
                            {[education.degree, education.branch, education.year].filter(Boolean).join(" • ") || "—"}
                        </p>
                        {education.cgpa && <p className="text-xs text-white/20">CGPA / %: {education.cgpa}</p>}
                        <p className="text-[10px] text-white/15 uppercase tracking-wider">{education.status?.replace("_", " ")}</p>
                    </div>
                </SummarySection>

                {/* Skills */}
                <SummarySection title="Skills & Interests" icon={Code2} onEdit={() => onEdit(3)}>
                    <div className="space-y-2">
                        <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Languages</p>
                            <div className="flex flex-wrap gap-1">
                                {skills.languages.length > 0
                                    ? skills.languages.map((l) => (
                                        <span key={l.name} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                            {l.name} <span className="text-yellow-400/50 capitalize">· {l.level}</span>
                                        </span>
                                    ))
                                    : <span className="text-xs text-white/15">—</span>}
                            </div>
                        </div>
                        {skills.frameworks.length > 0 && (
                            <div>
                                <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Frameworks</p>
                                <div className="flex flex-wrap gap-1">
                                    {skills.frameworks.map((f) => (
                                        <span key={f} className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-3/50 text-white/30 border border-white/[0.04]">{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Interests</p>
                            <div className="flex flex-wrap gap-1">
                                {skills.interests.length > 0
                                    ? skills.interests.map((t) => (
                                        <span key={t} className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20">{t}</span>
                                    ))
                                    : <span className="text-xs text-white/15">—</span>}
                            </div>
                        </div>
                    </div>
                </SummarySection>

                {/* Career */}
                <SummarySection title="Career Goals" icon={Target} onEdit={() => onEdit(4)}>
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                            {career.goals.map((g) => (
                                <span key={g} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">{g}</span>
                            ))}
                        </div>
                        {career.dream_companies.length > 0 && (
                            <p className="text-xs text-white/25">
                                <span className="text-white/15">Dream companies: </span>
                                {career.dream_companies.join(", ")}
                            </p>
                        )}
                        {career.preferred_roles.length > 0 && (
                            <p className="text-xs text-white/25">
                                <span className="text-white/15">Preferred roles: </span>
                                {career.preferred_roles.join(", ")}
                            </p>
                        )}
                        {career.weekly_hours && (
                            <p className="text-xs text-white/20">Practice: {career.weekly_hours} / week</p>
                        )}
                    </div>
                </SummarySection>

                {/* Social links summary */}
                {(profile.linkedin || profile.github || profile.portfolio || profile.bio) && (
                    <SummarySection title="Profile & Links" icon={Camera} onEdit={() => onEdit(5)}>
                        {profile.bio && <p className="text-xs text-white/40 mb-2">{profile.bio}</p>}
                        <div className="flex gap-3">
                            {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-blue-400 transition-colors">
                                    <Linkedin size={14} />
                                </a>
                            )}
                            {profile.github && (
                                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/60 transition-colors">
                                    <Github size={14} />
                                </a>
                            )}
                            {profile.portfolio && (
                                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-yellow-400 transition-colors">
                                    <Globe size={14} />
                                </a>
                            )}
                        </div>
                    </SummarySection>
                )}
            </div>
        </div>
    );
}
