"use client";

import React from "react";
import { Brain, Plus, X, Loader2, Target, Compass, Network, Briefcase, Sparkles } from "lucide-react";
import {
    learningStudio,
    type CourseV2,
    type TaxonomyKind,
    type TaxonomyItem,
} from "@/lib/services/learningStudioService";

interface Props {
    course: CourseV2 | null;
    onPatched: (next: CourseV2) => void;
}

// Maps each metadata section to:
//   - the controlled-vocab `TaxonomyKind` it draws from
//   - where on the course doc the selected slugs live (so PATCH knows the path)
type Section = {
    id: string;
    title: string;
    icon: React.ElementType;
    kind: TaxonomyKind;
    getSelected: (c: CourseV2) => string[];
    buildPatch: (next: string[]) => Partial<CourseV2>;
};

const SECTIONS: Section[] = [
    {
        id: "interests",
        title: "Interests",
        icon: Compass,
        kind: "interests",
        getSelected: (c) => c.targeting.interests,
        buildPatch: (next) => ({ targeting: { ...emptyTargeting(), interests: next } as any }),
    },
    {
        id: "career_goals",
        title: "Career goals",
        icon: Target,
        kind: "career_goals",
        getSelected: (c) => c.targeting.career_goals,
        buildPatch: (next) => ({ targeting: { ...emptyTargeting(), career_goals: next } as any }),
    },
    {
        id: "skills",
        title: "Skills taught",
        icon: Network,
        kind: "skills",
        getSelected: (c) => c.skills.gained_skills,
        buildPatch: (next) => ({ skills: { ...emptySkills(), gained_skills: next } as any }),
    },
    {
        id: "target_roles",
        title: "Target roles",
        icon: Briefcase,
        kind: "target_roles",
        getSelected: (c) => c.targeting.target_roles,
        buildPatch: (next) => ({ targeting: { ...emptyTargeting(), target_roles: next } as any }),
    },
    {
        id: "learning_styles",
        title: "Learning styles",
        icon: Sparkles,
        kind: "learning_styles",
        getSelected: (c) => c.targeting.learning_styles,
        buildPatch: (next) => ({ targeting: { ...emptyTargeting(), learning_styles: next } as any }),
    },
];

function emptyTargeting() {
    return { interests: [], career_goals: [], skill_alignment: [], learning_styles: [], target_roles: [], ideal_for: [] };
}
function emptySkills() {
    return { required_skills: [], gained_skills: [], prerequisite_course_ids: [] };
}

export default function IntelligencePanel({ course, onPatched }: Props) {
    if (!course) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain size={14} className="text-yellow-400/70" />
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40 font-semibold">
                            Intelligence
                        </p>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed">
                        Select a course to author the metadata that powers onboarding match,
                        recommendation ranking, and the skill graph.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 space-y-5">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Brain size={13} className="text-yellow-400/80" />
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-semibold">
                        Intelligence
                    </p>
                </div>
                <p className="text-[12px] text-white/40 leading-relaxed">
                    Every tag here feeds recommendation, onboarding match, and the future
                    adaptive learning engine — structured, not parsed.
                </p>
            </div>

            {SECTIONS.map((section) => (
                <TaxonomySection
                    key={section.id}
                    course={course}
                    section={section}
                    onPatched={onPatched}
                />
            ))}
        </div>
    );
}

// ── Per-section vocab picker ──────────────────────────────────────────

function TaxonomySection({
    course,
    section,
    onPatched,
}: {
    course: CourseV2;
    section: Section;
    onPatched: (next: CourseV2) => void;
}) {
    const Icon = section.icon;
    const [items, setItems] = React.useState<TaxonomyItem[] | null>(null);
    const [adding, setAdding] = React.useState(false);
    const [newLabel, setNewLabel] = React.useState("");
    const [proposing, setProposing] = React.useState(false);
    const selected = section.getSelected(course);

    React.useEffect(() => {
        learningStudio.taxonomy.list(section.kind).then((r) => {
            if (r.success) setItems(r.items);
        });
    }, [section.kind]);

    const persistSelection = async (next: string[]) => {
        // Build a focused patch that touches ONLY this field. The buildPatch
        // helper returns an empty-shell object as a guard; we replace it with
        // a dotted PATCH so siblings aren't clobbered.
        const dottedPath =
            section.id === "skills"
                ? { skills: { gained_skills: next } }
                : { targeting: { [section.id]: next } };
        const res = await learningStudio.courses.patch(course._id, dottedPath as any);
        if (res.success && res.course) onPatched(res.course);
    };

    const toggle = (slug: string) => {
        const exists = selected.includes(slug);
        const next = exists ? selected.filter((s) => s !== slug) : [...selected, slug];
        persistSelection(next);
    };

    const handlePropose = async () => {
        const label = newLabel.trim();
        if (!label) return;
        setProposing(true);
        try {
            const res = await learningStudio.taxonomy.propose(section.kind, label);
            if (res.success && res.item) {
                setItems((prev) => (prev ? [res.item!, ...prev] : [res.item!]));
                // Auto-select the newly-proposed item so the admin sees it apply.
                if (!selected.includes(res.item.slug)) {
                    persistSelection([...selected, res.item.slug]);
                }
            }
            setNewLabel("");
            setAdding(false);
        } finally {
            setProposing(false);
        }
    };

    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015]">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/[0.04]">
                <Icon size={12} className="text-white/50" />
                <p className="text-[11px] font-semibold text-white/70 tracking-wide">{section.title}</p>
                <span className="ml-auto text-[10px] text-white/30">{selected.length}</span>
            </div>

            <div className="p-3 flex flex-wrap gap-1.5">
                {items === null ? (
                    <span className="text-[11px] text-white/30 flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin" /> loading
                    </span>
                ) : (
                    <>
                        {items.map((it) => {
                            const isOn = selected.includes(it.slug);
                            return (
                                <button
                                    key={it._id}
                                    type="button"
                                    onClick={() => toggle(it.slug)}
                                    className={`text-[11px] px-2 py-1 rounded-md border transition ${
                                        isOn
                                            ? "bg-yellow-400/10 text-yellow-200 border-yellow-400/30"
                                            : "bg-white/[0.02] text-white/55 border-white/[0.05] hover:text-white/85 hover:border-white/[0.1]"
                                    } ${it.status === "pending" ? "italic" : ""}`}
                                    title={it.status === "pending" ? "Pending review" : ""}
                                >
                                    {it.label}
                                </button>
                            );
                        })}

                        {!adding ? (
                            <button
                                type="button"
                                onClick={() => setAdding(true)}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-dashed border-white/[0.1] text-white/40 hover:text-white/80 hover:border-white/30 transition"
                            >
                                <Plus size={10} /> Add
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-1 px-1 py-0.5 rounded-md border border-yellow-400/30 bg-yellow-400/[0.05]">
                                <input
                                    autoFocus
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handlePropose();
                                        if (e.key === "Escape") {
                                            setAdding(false);
                                            setNewLabel("");
                                        }
                                    }}
                                    disabled={proposing}
                                    placeholder="Label"
                                    className="bg-transparent text-[11px] text-yellow-100 placeholder:text-yellow-200/30 focus:outline-none w-24 px-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdding(false);
                                        setNewLabel("");
                                    }}
                                    className="p-0.5 text-yellow-200/60 hover:text-yellow-100"
                                    aria-label="Cancel"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
