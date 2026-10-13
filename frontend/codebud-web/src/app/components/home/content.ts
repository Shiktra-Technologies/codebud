/*
 * Homepage copy. Everything here is MYCODEBUD's own material — the site's
 * existing sections and the MyCodeBud info document — rearranged into the
 * scroll scenes. Keep claims here, not in the components, so a copy edit never
 * touches animation code.
 */

export type SectionId = "home" | "story" | "how" | "proof" | "team" | "contact";

export interface SectionMeta {
    id: SectionId;
    label: string;
    /** Pinned scenes offer SKIP while they hold the viewport. */
    pinned: boolean;
}

export const SECTIONS: SectionMeta[] = [
    { id: "home", label: "Home", pinned: false },
    { id: "story", label: "Story", pinned: true },
    { id: "how", label: "How it works", pinned: true },
    { id: "proof", label: "Proof", pinned: true },
    { id: "team", label: "Team", pinned: true },
    { id: "contact", label: "Contact", pinned: false },
];

/* ── Hero ─────────────────────────────────────────────────────────────── */

export const WORDMARK = "MYCODEBUD";
/** Letters before this index render bone, the rest brass — the MY|CODEBUD split. */
export const WORDMARK_SPLIT = 2;

export interface HeroNotice {
    id: string;
    body: string;
    /** Hero scroll progress at which this one arrives; 0 = on load. */
    at: number;
}

export const HERO_NOTICES: HeroNotice[] = [
    {
        id: "what",
        body: "MYCODEBUD is a career and capability-building ecosystem for engineering students.",
        at: 0,
    },
    {
        id: "layers",
        body: "Guidance, mentorship, projects, DSA, hackathons and placement support — built as proof, not paperwork.",
        at: 0.1,
    },
    {
        id: "price",
        body: "The full ecosystem for ₹99 a month. No separate paywalls.",
        at: 0.22,
    },
];

export const HERO_PROBLEM = {
    label: "The problem",
    text: "Students collect certificates, and still arrive at interviews with nothing real to show for it.",
    coda: "That gap is where MYCODEBUD started.",
};

/* ── Photography ──────────────────────────────────────────────────────── */

/** Self-hosted Unsplash photos (Unsplash License) — credits in ATTRIBUTIONS.md. */
export interface PhotoRef {
    src: string;
    alt: string;
    /** CSS object-position for the crop. */
    position?: string;
}

/* ── Story ────────────────────────────────────────────────────────────── */

export type StoryVariant = "brass" | "orb" | "comb" | "code" | "photo";

export interface StoryCard {
    id: string;
    variant: StoryVariant;
    eyebrow: string;
    title?: string;
    lead?: string;
    lines: string[];
    image?: PhotoRef;
}

export const STORY_CARDS: StoryCard[] = [
    {
        id: "idea",
        variant: "brass",
        eyebrow: "01 — The idea",
        title: "It started in 2025, with one shared idea.",
        lines: [
            "Our founder shared it with our co-founder — who began building the first version alone.",
        ],
    },
    {
        id: "platform",
        variant: "orb",
        eyebrow: "02 — The platform",
        lead: "Not another course library.",
        lines: [
            "One platform: interactive lessons, real-world projects and AI-powered feedback — instead of scattered learning resources.",
        ],
    },
    {
        id: "team",
        variant: "comb",
        eyebrow: "03 — The catalogue",
        title: "Then the team grew. So did the catalogue.",
        lines: ["> 3,000+ DSA problems.", "> 50,000+ aptitude questions.", "> 85+ courses published."],
    },
    {
        id: "ecosystem",
        variant: "code",
        eyebrow: "04 — The ecosystem",
        lead: "What began as one developer's side project became an ecosystem.",
        lines: [
            "— A Shiktra Technologies LLP venture. Udyam Registered, VTU Registered, recognised by Govt. of Karnataka through K-TECH.",
        ],
    },
    {
        id: "today",
        variant: "photo",
        eyebrow: "05 — Today",
        title: "Students. Colleges. Companies. One ecosystem.",
        lines: [
            "Students get guidance, mentorship and proof they can show a recruiter.",
            "Colleges get stronger placement outcomes.",
            "Companies get capability-tested talent — free of cost.",
        ],
        image: {
            src: "/images/home/story-students.webp",
            alt: "Three students laughing together outdoors",
            position: "50% 35%",
        },
    },
];

/** The cover snippet from the MyCodeBud info document. */
export const STORY_CODE: { text: string; tone?: "kw" | "str" | "com" | "dim" }[][] = [
    [{ text: "const ", tone: "kw" }, { text: "student = {" }],
    [{ text: "  certificate: " }, { text: "true", tone: "kw" }, { text: ",  " }, { text: "// common", tone: "com" }],
    [{ text: "  proof: " }, { text: "false", tone: "kw" }, { text: ",       " }, { text: "// rare", tone: "com" }],
    [{ text: "};", tone: "dim" }],
    [],
    [{ text: "function ", tone: "kw" }, { text: "withMyCodeBud() {" }],
    [{ text: "  student.proof = " }, { text: '"shipped"', tone: "str" }, { text: ";" }],
    [{ text: "  return ", tone: "kw" }, { text: "student;" }],
    [{ text: "}", tone: "dim" }],
];

/* ── How it works — the student journey ───────────────────────────────── */

export interface JourneyStep {
    title: string;
    tag: string;
    body: string;
    /** CSS colour for the dial marker. */
    color: string;
    image: PhotoRef;
    /** "What you get" at this step — from the info document's pillar lists. */
    includes: string[];
    /** One headline figure for the step. `mono` sets it as code. */
    figure: { value: string; label: string; mono?: boolean };
}

export const JOURNEY_CAPTION = "From sign-up to placement — one continuous path";

export const JOURNEY: JourneyStep[] = [
    {
        title: "Sign Up & Skill Check",
        tag: "Onboarding",
        body: "Start with a skill check, so the path begins from where you actually are — not from page one of a syllabus.",
        color: "var(--brass-500)",
        image: { src: "/images/home/step-01-start.webp", alt: "A student smiling with a laptop on campus steps", position: "50% 30%" },
        includes: ["Guidance & direction", "Mentorship access", "Core + novelty projects", "DSA question bank"],
        figure: { value: "₹99", label: "per student, per month — the whole ecosystem" },
    },
    {
        title: "Guided Learning Path",
        tag: "Guidance",
        body: "Structured guidance and DSA fundamentals, aligned to what companies expect.",
        color: "var(--patina-300)",
        image: { src: "/images/home/step-02-learn.webp", alt: "A student working through digital logic on a whiteboard" },
        includes: ["Structured guidance", "DSA fundamentals", "Aligned to what companies expect", "Learn → Build → Prove"],
        figure: { value: "85+", label: "courses published" },
    },
    {
        title: "Core & Novelty Projects",
        tag: "Build",
        body: "Core projects build fundamentals. Novelty projects build a portfolio. Mentor code reviews at every stage.",
        color: "var(--ember-500)",
        image: { src: "/images/home/step-03-build.webp", alt: "Source code on a monitor" },
        includes: ["Portfolio-ready builds", "Novelty-first project briefs", "Mentor code reviews", "GitHub-ready documentation"],
        figure: { value: "copied: false", label: "every brief is written to be novelty-first", mono: true },
    },
    {
        title: "DSA Practice Sprints",
        tag: "Practice",
        body: "Topic-wise tracks and company-specific question banks. Weak-topic diagnostics show exactly where to focus next.",
        color: "var(--steel-500)",
        image: { src: "/images/home/step-04-practice.webp", alt: "Students practising in a computer lab" },
        includes: ["Topic-wise DSA tracks", "Company-specific question banks", "Timed mock coding rounds", "Weak-topic diagnostics"],
        figure: { value: "3,000+", label: "DSA problems in the catalogue" },
    },
    {
        title: "1:1 Mentorship",
        tag: "Guidance",
        body: "Mentors with real industry experience — for technical direction, career roadmapping, and resume and portfolio reviews.",
        color: "var(--brass-300)",
        image: { src: "/images/home/step-05-mentor.webp", alt: "A mentor talking a student through code on a laptop", position: "60% 40%" },
        includes: ["1:1 and group mentorship", "Career roadmapping", "Mock interviews with real feedback", "Resume and portfolio reviews"],
        figure: { value: "1:1", label: "plus group sessions and industry AMAs" },
    },
    {
        title: "Hackathon Participation",
        tag: "Prove",
        body: "Mentor-guided teams, real industry problem statements and national-level competition support — then pitch it on Demo Day.",
        color: "var(--patina-500)",
        image: { src: "/images/home/step-06-hackathon.webp", alt: "Teams building at a hackathon" },
        includes: ["Mentor-guided teams", "Industry-relevant problem statements", "National-level competition support", "Demo Day pitching practice"],
        figure: { value: "SIH", label: "jury-panel mentors in the network" },
    },
    {
        title: "Interview Preparation",
        tag: "Ready",
        body: "Timed mock coding rounds and interview simulations, so you hear what to fix before it costs you an offer.",
        color: "var(--signal-400)",
        image: { src: "/images/home/step-07-interview.webp", alt: "An interview in progress, seen through glass" },
        includes: ["Timed mock coding rounds", "Interview simulations with mentors", "Top-company interview questions", "Readiness, not last-minute cramming"],
        figure: { value: "50,000+", label: "aptitude questions to practise" },
    },
    {
        title: "Career & Placement Support",
        tag: "Outcome",
        body: "Career and placement guidance, with direct visibility to recruiters across our hiring network.",
        color: "var(--carbon-bone)",
        image: { src: "/images/home/step-08-offer.webp", alt: "A handshake across a desk after an interview", position: "35% 40%" },
        includes: ["Career & placement guidance", "Direct recruiter visibility", "Internships and live projects", "Free for companies to hire"],
        figure: { value: "7", label: "hiring partners across Karnataka" },
    },
];

/* ── Proof — credentials vs. proof ────────────────────────────────────── */

export interface ProofMessage {
    id: string;
    from: string;
    time: string;
    body: string;
    /** Scene progress at which it lands. Below 0 is the stage's approach: -0.25
     *  as it starts to enter, 0 as it pins — so a message can greet the scene
     *  on its way in. */
    at: number;
    /** The MYCODEBUD side shows a typing indicator before it lands. */
    typing: boolean;
    visual?: "diff";
    image?: PhotoRef;
}

export const PROOF_CAPTION = "Credentials vs. proof";

/** The product walkthrough on the official Mycodebud YouTube channel. */
export const DEMO_VIDEO = {
    id: "4xKh__QymKA",
    title: "MYCODEBUD product demo",
    /** Its YouTube thumbnail, self-hosted — the still frame on phones and under reduced motion. */
    poster: "/images/home/demo-poster.webp",
};

export const PROOF_MESSAGES: ProofMessage[] = [
    {
        id: "recruiter",
        from: "Campus recruiter",
        time: "9:41 AM",
        body: "Every résumé in this pile says “certified”.",
        at: -0.11,
        typing: false,
    },
    {
        id: "certificate",
        from: "MYCODEBUD team",
        time: "Now",
        body: "A certificate says you showed up.",
        at: 0.25,
        typing: true,
        image: { src: "/images/home/proof-paperwork.webp", alt: "Tall stacks of paper files in an office" },
    },
    {
        id: "project",
        from: "MYCODEBUD team",
        time: "Always",
        body: "A project proves you can build.",
        at: 0.47,
        typing: true,
        visual: "diff",
    },
];

export const PROOF_DIFF: { sign: "-" | "+" | "//"; text: string }[] = [
    { sign: "//", text: "a certificate is evidence you were present." },
    { sign: "-", text: "Completed a course" },
    { sign: "-", text: "Attended a webinar" },
    { sign: "-", text: "Sat through a syllabus" },
    { sign: "-", text: "Downloaded a PDF" },
    { sign: "+", text: "Shipped a working project" },
    { sign: "+", text: "Solved problems under a mentor's eye" },
    { sign: "+", text: "Debugged something real, live, on Demo Day" },
    { sign: "+", text: "Handled a technical interview like a rehearsal" },
    { sign: "//", text: "a project is evidence you can build." },
];

/* ── Team ─────────────────────────────────────────────────────────────── */

export const TEAM_HEADLINE = "A small team of builders, guided by mentors who've done the job — not just taught it.";

export interface TeamCard {
    id: string;
    orb: "brass" | "patina" | "ember";
    title: string;
    lead: string;
    /** The founding team, as hex avatars plus a roster. */
    members?: { name: string; role: string; initials: string }[];
    /** Mentor affiliations, as chips. */
    chips?: string[];
    /** Hiring partners with their city. */
    partners?: { name: string; city: string }[];
    image?: PhotoRef;
    note?: string;
}

export const TEAM_CARDS: TeamCard[] = [
    {
        id: "team",
        orb: "brass",
        title: "Built by a small team.",
        lead: "Started in 2025 — one idea, one developer, then a team.",
        members: [
            { name: "Rohan Gowda", role: "Founder & CEO", initials: "RG" },
            { name: "Aman Rao M", role: "Co-founder & CTO", initials: "AR" },
            { name: "Nikhil Bajantri", role: "Development Lead", initials: "NB" },
            { name: "Bimal P B", role: "Full Stack Developer", initials: "BP" },
            { name: "B Vibha", role: "Full Stack Developer", initials: "BV" },
        ],
    },
    {
        id: "mentors",
        orb: "patina",
        title: "Guided by practitioners.",
        lead: "Mentors from product companies, IT services, consulting and academia.",
        chips: [
            "Amazon",
            "TCS",
            "Infosys",
            "Precisely",
            "IIIT Roorkee (UK)",
            "Galagher",
            "Manpro",
            "WEMIT India",
            "Global Minds India",
            "SIH jury panel",
        ],
        image: { src: "/images/home/team-mentors.webp", alt: "A practitioner session in a workshop room" },
        note: "Affiliations shown for context on professional background — not endorsements.",
    },
    {
        id: "partners",
        orb: "ember",
        title: "Backed by a hiring network.",
        lead: "Internships, hiring pipelines and hands-on project exposure.",
        partners: [
            { name: "Global Minds India", city: "Bengaluru" },
            { name: "Vyanika Innovations", city: "Mangaluru" },
            { name: "Notarc", city: "Bengaluru" },
            { name: "Wemit India", city: "Bengaluru" },
            { name: "Man Pro Solutions", city: "Bengaluru" },
            { name: "Sky Wires and Cables", city: "Bengaluru" },
            { name: "Sun Automats", city: "Bengaluru" },
        ],
        image: { src: "/images/home/team-partners.webp", alt: "A team meeting in an office", position: "60% 30%" },
    },
];

/* ── Ticker band between Story and How it works ───────────────────────── */

export const TICKER_FIGURES = [
    "3,000+ DSA problems",
    "50,000+ aptitude questions",
    "85+ courses",
    "₹99 a month",
    "8 steps to placement",
    "7 ecosystem layers",
];

export const TICKER_CREDENTIALS = [
    "Recognised by Govt. of Karnataka",
    "K-TECH",
    "New Age Innovation Network",
    "VTU Approved",
    "Udyam Certified",
    "A Shiktra Technologies LLP venture",
];

/* ── Contact ──────────────────────────────────────────────────────────── */

export const CONTACT = {
    glyph: "</>",
    label: "Our vision",
    statement:
        "To be the ecosystem every Indian engineering student wishes they'd found in year one — where proof of capability, not paperwork, decides who gets the opportunity.",
    email: "info@mycodebud.in",
    place: "Bengaluru, India",
    company: "Shiktra Technologies LLP",
};
