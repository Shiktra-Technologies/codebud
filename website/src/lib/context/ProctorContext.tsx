"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Violation {
    id: number;
    type: "CRITICAL" | "WARNING";
    description: string;
    timestamp: string;
}

interface Permissions {
    camera: boolean;
    microphone: boolean;
    fullscreen: boolean;
}

interface ProctorState {
    isMonitoring: boolean;
    tabSwitched: boolean;
    testSubmitted: boolean;
    violations: Violation[];
    violationCount: number;
    maxViolations: number;
    autoSubmitted: boolean;
}

interface ProctorContextValue {
    permissions: Permissions;
    proctorState: ProctorState;
    mediaStream: MediaStream | null;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    requestMediaPermissions: () => Promise<boolean>;
    requestFullscreen: () => Promise<boolean>;
    startMonitoring: () => void;
    pauseMonitoring: () => void;
    stopMonitoring: () => void;
    exitFullscreen: () => void;
    completeTestCleanup: () => void;
    addViolation: (type: "CRITICAL" | "WARNING", description: string) => void;
    submitTestDueToViolation: (reason: string) => void;
}

const ProctorContext = createContext<ProctorContextValue | null>(null);

export const useProctor = () => {
    const context = useContext(ProctorContext);
    if (!context) {
        throw new Error("useProctor must be used within a ProctorProvider");
    }
    return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ProctorProvider = ({ children }: { children: React.ReactNode }) => {
    const [permissions, setPermissions] = useState<Permissions>({
        camera: false,
        microphone: false,
        fullscreen: false,
    });

    const [proctorState, setProctorState] = useState<ProctorState>({
        isMonitoring: false,
        tabSwitched: false,
        testSubmitted: false,
        violations: [],
        violationCount: 0,
        maxViolations: 5,
        autoSubmitted: false,
    });

    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const modelRef = useRef<any>(null);
    const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Load AI model (TensorFlow.js + COCO-SSD) ────────────────────────

    useEffect(() => {
        const loadModel = async () => {
            if (typeof window === "undefined") return;
            try {
                const tf = await import("@tensorflow/tfjs");
                await tf.setBackend("webgl");
                const cocoSsd = await import("@tensorflow-models/coco-ssd");
                const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
                modelRef.current = model;
                setModelsLoaded(true);
                console.log("[PROCTOR] AI model loaded — person detection active");
            } catch (err) {
                console.warn("[PROCTOR] AI model failed, basic monitoring only:", err);
                setModelsLoaded(true); // continue without AI
            }
        };
        loadModel();
    }, []);

    // ─── Memory cleanup every 30s ─────────────────────────────────────────

    useEffect(() => {
        cleanupTimerRef.current = setInterval(async () => {
            try {
                const tf = await import("@tensorflow/tfjs");
                tf.engine().disposeVariables();
            } catch { /* ignore */ }
        }, 30_000);
        return () => {
            if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
        };
    }, []);

    // ─── Request camera + microphone ──────────────────────────────────────

    const requestMediaPermissions = useCallback(async (): Promise<boolean> => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Media devices not supported");
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    facingMode: "user",
                    frameRate: { ideal: 15, max: 30 },
                },
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            setMediaStream(stream);
            setPermissions((p) => ({ ...p, camera: true, microphone: true }));
            console.log("[PROCTOR] Camera + Mic granted");
            return true;
        } catch (err: any) {
            let msg = "Failed to access camera/microphone. ";
            if (err.name === "NotAllowedError")
                msg += "Please allow access in your browser address bar and refresh.";
            else if (err.name === "NotFoundError")
                msg += "No camera or microphone found.";
            else if (err.name === "NotReadableError")
                msg += "Camera is used by another app. Close it and retry.";
            else msg += err.message;
            alert(msg);
            return false;
        }
    }, []);

    // ─── Request fullscreen ───────────────────────────────────────────────

    const requestFullscreen = useCallback(async (): Promise<boolean> => {
        try {
            const el = document.documentElement as any;
            if (el.requestFullscreen) await el.requestFullscreen();
            else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
            else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
            else if (el.msRequestFullscreen) await el.msRequestFullscreen();
            else {
                alert("Fullscreen not supported. Press F11.");
                return false;
            }
            setTimeout(() => {
                const d = document as any;
                if (
                    d.fullscreenElement ||
                    d.webkitFullscreenElement ||
                    d.mozFullScreenElement ||
                    d.msFullscreenElement
                ) {
                    setPermissions((p) => ({ ...p, fullscreen: true }));
                }
            }, 200);
            console.log("[PROCTOR] Fullscreen entered");
            return true;
        } catch (err: any) {
            alert("Fullscreen failed. Try pressing F11.");
            return false;
        }
    }, []);

    // ─── Start / Pause / Stop monitoring ──────────────────────────────────

    const startMonitoring = useCallback(() => {
        console.log("[PROCTOR] Monitoring started");
        setProctorState((p) => ({ ...p, isMonitoring: true }));
    }, []);

    const pauseMonitoring = useCallback(() => {
        setProctorState((p) => ({ ...p, isMonitoring: false }));
    }, []);

    const stopMonitoring = useCallback(() => {
        setProctorState((p) => ({ ...p, isMonitoring: false }));
        if (mediaStream) {
            mediaStream.getTracks().forEach((t) => t.stop());
            setMediaStream(null);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setPermissions((p) => ({ ...p, camera: false, microphone: false }));
    }, [mediaStream]);

    const exitFullscreen = useCallback(() => {
        const d = document as any;
        if (d.exitFullscreen) d.exitFullscreen().catch(() => {});
        else if (d.webkitExitFullscreen) try { d.webkitExitFullscreen(); } catch {}
        else if (d.mozCancelFullScreen) try { d.mozCancelFullScreen(); } catch {}
        else if (d.msExitFullscreen) try { d.msExitFullscreen(); } catch {}
        setPermissions((p) => ({ ...p, fullscreen: false }));
    }, []);

    const completeTestCleanup = useCallback(() => {
        console.log("[PROCTOR] Full cleanup");
        setProctorState((p) => ({
            ...p,
            isMonitoring: false,
            testSubmitted: true,
        }));
        setPermissions({ camera: false, microphone: false, fullscreen: false });

        // async exit fullscreen
        setTimeout(() => {
            const d = document as any;
            if (d.exitFullscreen) d.exitFullscreen().catch(() => {});
            else if (d.webkitExitFullscreen) try { d.webkitExitFullscreen(); } catch {}
            else if (d.mozCancelFullScreen) try { d.mozCancelFullScreen(); } catch {}
            else if (d.msExitFullscreen) try { d.msExitFullscreen(); } catch {}
        }, 0);

        // async media cleanup
        setTimeout(() => {
            if (mediaStream) {
                mediaStream.getTracks().forEach((t) => {
                    try { t.stop(); } catch {}
                });
                setMediaStream(null);
            }
            if (audioContextRef.current) {
                try { audioContextRef.current.close(); } catch {}
                audioContextRef.current = null;
            }
        }, 50);
    }, [mediaStream]);

    // ─── Violation tracking ───────────────────────────────────────────────

    const addViolation = useCallback(
        (type: "CRITICAL" | "WARNING", description: string) => {
            if (proctorState.testSubmitted) return;
            const violation: Violation = {
                id: Date.now(),
                type,
                description,
                timestamp: new Date().toISOString(),
            };
            setProctorState((p) => ({
                ...p,
                violations: [...p.violations, violation],
                violationCount: p.violationCount + 1,
            }));
            console.warn("[PROCTOR] Violation:", violation);
        },
        [proctorState.testSubmitted]
    );

    const submitTestDueToViolation = useCallback((reason: string) => {
        const violation: Violation = {
            id: Date.now(),
            type: "CRITICAL",
            description: reason,
            timestamp: new Date().toISOString(),
        };
        console.warn("[PROCTOR] CRITICAL — auto-submit:", reason);
        setProctorState((p) => ({
            ...p,
            violations: [...p.violations, violation],
            violationCount: p.violationCount + 1,
            testSubmitted: true,
            tabSwitched: true,
            autoSubmitted: true,
        }));
    }, []);

    // ─── Auto-submit at max violations ────────────────────────────────────

    useEffect(() => {
        if (
            proctorState.violationCount >= proctorState.maxViolations &&
            !proctorState.testSubmitted &&
            proctorState.isMonitoring
        ) {
            const summary = proctorState.violations.map((v) => v.description).join(", ");
            submitTestDueToViolation(
                `Maximum violations exceeded (${proctorState.violationCount}/${proctorState.maxViolations}). ${summary}`
            );
        }
    }, [
        proctorState.violationCount,
        proctorState.maxViolations,
        proctorState.testSubmitted,
        proctorState.isMonitoring,
        proctorState.violations,
        submitTestDueToViolation,
    ]);

    // ─── AI detection (camera person count + audio) ───────────────────────

    useEffect(() => {
        if (
            !proctorState.isMonitoring ||
            proctorState.testSubmitted ||
            !modelsLoaded ||
            !mediaStream ||
            !videoRef.current
        )
            return;

        let intervalId: NodeJS.Timeout;
        let analyser: AnalyserNode | null = null;
        let source: MediaStreamAudioSourceNode | null = null;

        const run = async () => {
            const video = videoRef.current!;
            if (!video.srcObject) {
                video.srcObject = mediaStream;
                await video.play().catch(() => {});
            }

            // Audio setup
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext ||
                        (window as any).webkitAudioContext)();
                }
                analyser = audioContextRef.current.createAnalyser();
                source = audioContextRef.current.createMediaStreamSource(mediaStream);
                source.connect(analyser);
                analyser.fftSize = 256;
            } catch {}

            const dataArray = analyser
                ? new Uint8Array(analyser.frequencyBinCount)
                : null;

            const check = async () => {
                try {
                    // Person detection via COCO-SSD
                    if (
                        video.readyState === 4 &&
                        modelRef.current
                    ) {
                        const predictions = await modelRef.current.detect(video);
                        const personCount = predictions.filter(
                            (p: any) => p.class === "person"
                        ).length;

                        if (personCount >= 2) {
                            submitTestDueToViolation(
                                `Critical: ${personCount} people detected in camera frame`
                            );
                        }
                    }

                    // Audio speech detection
                    if (analyser && dataArray) {
                        analyser.getByteFrequencyData(dataArray);
                        const avg =
                            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                        if (avg / 128 > 0.1) {
                            // speech detected — just log, don't auto-submit
                        }
                    }
                } catch {}
            };

            intervalId = setInterval(check, 2000);
        };

        run();

        return () => {
            clearInterval(intervalId);
            if (
                audioContextRef.current &&
                audioContextRef.current.state !== "closed"
            ) {
                audioContextRef.current.close().catch(() => {});
                audioContextRef.current = null;
            }
        };
    }, [
        proctorState.isMonitoring,
        proctorState.testSubmitted,
        modelsLoaded,
        mediaStream,
        submitTestDueToViolation,
    ]);

    // ─── Event monitoring (tab switch, blur, keys, right-click, fullscreen) ──

    useEffect(() => {
        if (!proctorState.isMonitoring || proctorState.testSubmitted) return;

        const handleVisibility = () => {
            if (document.hidden) {
                addViolation("CRITICAL", "Tab switched or window minimized");
            }
        };

        const handleBlur = () => {
            if (document.visibilityState === "visible") {
                addViolation("CRITICAL", "Lost focus — switched to another application");
            }
        };

        const handleKeydown = (e: KeyboardEvent) => {
            // Block Ctrl/Cmd + T/W/N/R/Tab
            if (
                (e.ctrlKey || e.metaKey) &&
                ["t", "w", "n", "r", "Tab"].includes(e.key)
            ) {
                e.preventDefault();
                addViolation("CRITICAL", "Prohibited keyboard shortcut attempted");
            }
            // Block F12
            if (e.key === "F12") {
                e.preventDefault();
                addViolation("CRITICAL", "Attempted to open developer tools");
            }
        };

        const handleContextMenu = (e: Event) => {
            e.preventDefault();
            addViolation("WARNING", "Right-click attempted");
        };

        const handleFullscreenChange = () => {
            const d = document as any;
            if (
                !d.fullscreenElement &&
                !d.webkitFullscreenElement &&
                !d.mozFullScreenElement &&
                !d.msFullscreenElement
            ) {
                if (proctorState.isMonitoring) {
                    submitTestDueToViolation("Exited fullscreen mode during test");
                }
                setPermissions((p) => ({ ...p, fullscreen: false }));
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("keydown", handleKeydown);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

        // Disable text selection during test
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("keydown", handleKeydown);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.body.style.userSelect = "";
            document.body.style.webkitUserSelect = "";
        };
    }, [
        proctorState.isMonitoring,
        proctorState.testSubmitted,
        addViolation,
        submitTestDueToViolation,
    ]);

    // ─── Value ────────────────────────────────────────────────────────────

    const value: ProctorContextValue = {
        permissions,
        proctorState,
        mediaStream,
        videoRef,
        requestMediaPermissions,
        requestFullscreen,
        startMonitoring,
        pauseMonitoring,
        stopMonitoring,
        exitFullscreen,
        completeTestCleanup,
        addViolation,
        submitTestDueToViolation,
    };

    return (
        <ProctorContext.Provider value={value}>
            {/* Hidden video element for AI detection */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            />
            {children}
        </ProctorContext.Provider>
    );
};
