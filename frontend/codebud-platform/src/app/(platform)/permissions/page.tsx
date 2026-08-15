"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useProctor } from "@/lib/context/ProctorContext";
import {
    getEnvironmentInfo,
    getPermissionInstructions,
} from "@/lib/utils/environmentCheck";
import {
    Camera,
    Mic,
    Monitor,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Shield,
    ChevronRight,
    RotateCcw,
    ArrowLeft,
    Wifi,
    WifiOff,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export default function PermissionsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const testType = searchParams.get("test") || "aptitude";
    const { requestMediaPermissions, requestFullscreen, permissions } = useProctor();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState({
        camera: "prompt",
        microphone: "prompt",
    });
    const [envInfo, setEnvInfo] = useState<any>(null);

    // Validate test type
    useEffect(() => {
        if (testType !== "aptitude" && testType !== "dsa") {
            router.push("/dashboard");
        }
    }, [testType, router]);

    // Check environment
    useEffect(() => {
        if (typeof window === "undefined") return;
        setEnvInfo(getEnvironmentInfo());

        const checkPerms = async () => {
            if (!navigator.permissions) return;
            try {
                const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
                const mic = await navigator.permissions.query({ name: "microphone" as PermissionName });
                setPermissionStatus({ camera: cam.state, microphone: mic.state });
                cam.onchange = () => setPermissionStatus((p) => ({ ...p, camera: cam.state }));
                mic.onchange = () => setPermissionStatus((p) => ({ ...p, microphone: mic.state }));
            } catch {}
        };
        checkPerms();
    }, []);

    const testInfo =
        testType === "dsa"
            ? { title: "DSA Challenge", route: "/dsa-test?start=true" }
            : { title: "Aptitude Assessment", route: "/aptitude-test?start=true" };

    const steps = [
        {
            title: "Camera & Microphone",
            description:
                "We need access to your camera and microphone to monitor the test environment",
            icon: Camera,
            action: async () => {
                setLoading(true);
                const ok = await requestMediaPermissions();
                setLoading(false);
                return ok;
            },
            completed: permissions.camera && permissions.microphone,
        },
        {
            title: "Fullscreen Mode",
            description:
                "The test must be taken in fullscreen mode to prevent switching applications",
            icon: Monitor,
            action: async () => {
                setLoading(true);
                const ok = await requestFullscreen();
                setLoading(false);
                return ok;
            },
            completed: permissions.fullscreen,
        },
    ];

    const handleStepAction = async () => {
        const step = steps[currentStep];
        if (step.completed) {
            goNext();
            return;
        }
        const ok = await step.action();
        if (ok) goNext();
    };

    const goNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            router.push(testInfo.route);
        }
    };

    const allDone = steps.every((s) => s.completed);
    const isDenied =
        permissionStatus.camera === "denied" ||
        permissionStatus.microphone === "denied";

    return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="w-full max-w-lg"
            >
                {/* Back */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/40 transition-colors mb-6 group"
                >
                    <ArrowLeft
                        size={14}
                        className="group-hover:-translate-x-0.5 transition-transform"
                    />
                    Back to Dashboard
                </button>

                <div className="bg-surface-2/50 rounded-2xl border border-white/[0.06] overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-white/[0.04]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                                <Shield size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">
                                    {testInfo.title}
                                </h1>
                                <p className="text-xs text-white/25">
                                    Set up monitoring before starting
                                </p>
                            </div>
                        </div>

                        {/* HTTPS warning */}
                        {typeof window !== "undefined" &&
                            !window.location.protocol.includes("https") &&
                            window.location.hostname !== "localhost" && (
                                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                                    <WifiOff size={14} className="text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-400/80">
                                        <span className="font-semibold">HTTPS Required</span> — Camera
                                        access needs a secure connection.
                                    </p>
                                </div>
                            )}

                        {/* Env issues */}
                        {envInfo && !envInfo.isCompatible && (
                            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-red-400/80 font-semibold mb-1">
                                    Compatibility Issues:
                                </p>
                                <ul className="space-y-0.5">
                                    {envInfo.issues.map((issue: string) => (
                                        <li
                                            key={issue}
                                            className="text-[11px] text-red-400/60 flex items-center gap-1.5"
                                        >
                                            <AlertTriangle size={10} className="shrink-0" />
                                            {issue} — not supported
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Step progress */}
                    <div className="flex items-center px-6 py-4 gap-2">
                        {steps.map((step, i) => (
                            <React.Fragment key={i}>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
                                            step.completed
                                                ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/20"
                                                : i === currentStep
                                                ? "bg-yellow-400 text-surface-0"
                                                : "bg-surface-3/40 text-white/20 border border-white/[0.04]"
                                        }`}
                                    >
                                        {step.completed ? (
                                            <CheckCircle2 size={14} />
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-medium ${
                                            step.completed
                                                ? "text-emerald-400/60"
                                                : i === currentStep
                                                ? "text-white/60"
                                                : "text-white/20"
                                        }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Current step card */}
                    <div className="px-6 pb-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25, ease }}
                                className="bg-surface-3/30 rounded-xl border border-white/[0.06] p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {React.createElement(steps[currentStep].icon, {
                                        size: 20,
                                        className: steps[currentStep].completed
                                            ? "text-emerald-400"
                                            : "text-yellow-400",
                                    })}
                                    <div>
                                        <h3 className="text-sm font-bold text-white">
                                            {steps[currentStep].title}
                                        </h3>
                                        <p className="text-xs text-white/30 mt-0.5">
                                            {steps[currentStep].description}
                                        </p>
                                    </div>
                                </div>

                                {/* Permission denied help */}
                                {isDenied && currentStep === 0 && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/15">
                                        <p className="text-xs text-red-400/80 font-semibold mb-2">
                                            🚨 Permissions Blocked
                                        </p>
                                        {envInfo && (
                                            <p className="text-[11px] text-white/30 mb-1">
                                                <span className="text-white/50 font-medium">
                                                    {envInfo.browser}:
                                                </span>{" "}
                                                {getPermissionInstructions(envInfo.browser)?.camera ||
                                                    "Click the camera icon in your address bar and allow access."}
                                            </p>
                                        )}
                                        <ol className="text-[11px] text-white/25 space-y-0.5 list-decimal list-inside mt-2">
                                            <li>Click the camera icon in the address bar</li>
                                            <li>Change setting to &ldquo;Allow&rdquo;</li>
                                            <li>Click Retry below</li>
                                        </ol>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs font-medium text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                                        >
                                            <RotateCcw size={12} /> Retry Permissions
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleStepAction}
                                    disabled={loading}
                                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                        steps[currentStep].completed
                                            ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/20"
                                            : "bg-yellow-400 text-surface-0 hover:bg-yellow-300 shadow-[0_0_20px_rgba(255,193,7,0.15)]"
                                    } disabled:opacity-50`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Requesting…
                                        </>
                                    ) : steps[currentStep].completed ? (
                                        <>
                                            <CheckCircle2 size={16} /> Granted — Continue
                                            <ChevronRight size={14} />
                                        </>
                                    ) : (
                                        <>
                                            Grant{" "}
                                            {currentStep === 0
                                                ? "Camera & Mic"
                                                : "Fullscreen"}
                                            <ChevronRight size={14} />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </AnimatePresence>

                        {/* Skip to test if all done */}
                        {allDone && (
                            <motion.button
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, ease }}
                                onClick={() => router.push(testInfo.route)}
                                className="w-full mt-4 py-3 rounded-xl bg-yellow-400 text-surface-0 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(255,193,7,0.15)] flex items-center justify-center gap-2"
                            >
                                Start {testInfo.title}
                                <ChevronRight size={16} />
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
