"use client";

import React, { useEffect, useRef } from "react";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Color4,
    Vector3,
} from "@babylonjs/core";

export const BabylonScene: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Opt-out is `data-honey="off"`, matching the honeycomb and honey layers
        // rather than prefers-reduced-motion — Windows' "animation effects"
        // toggle drives that query and is commonly off, which froze this scene
        // for a large share of users with nothing to indicate why.
        const isStill = () => document.documentElement.dataset.honey === "off";

        const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
        engine.setHardwareScalingLevel(2); // Half-res for perf
        engineRef.current = engine;

        const scene = new Scene(engine);
        scene.clearColor = new Color4(0, 0, 0, 0);
        scene.fogMode = Scene.FOGMODE_LINEAR;
        scene.fogColor = new Color3(0.02, 0.02, 0.02);
        scene.fogStart = 8;
        scene.fogEnd = 25;

        // Camera — fixed, no interaction
        const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2.5, 18, Vector3.Zero(), scene);
        camera.inputs.clear(); // No user interaction

        // Subtle ambient light
        const light = new HemisphericLight("light", new Vector3(0, 1, -0.3), scene);
        light.intensity = 0.6;
        light.diffuse = new Color3(1, 0.85, 0.4);
        light.groundColor = new Color3(0.05, 0.05, 0.1);

        // Wireframe amber material
        const wireMat = new StandardMaterial("wire", scene);
        wireMat.wireframe = true;
        wireMat.emissiveColor = new Color3(1, 0.76, 0.03); // #FFC107
        wireMat.alpha = 0.12;
        wireMat.disableLighting = true;

        // Semi-transparent solid material
        const solidMat = new StandardMaterial("solid", scene);
        solidMat.emissiveColor = new Color3(1, 0.76, 0.03);
        solidMat.alpha = 0.04;
        solidMat.disableLighting = true;

        interface ParticleData {
            mesh: { position: Vector3; rotation: Vector3; dispose: () => void };
            baseY: number;
            floatSpeed: number;
            floatAmp: number;
            rotSpeed: { x: number; y: number; z: number };
        }

        const particles: ParticleData[] = [];
        // Hexagonal prisms — the ambient comb's flat-top cell, extruded. Depth
        // varies so the field reads as cells at different distances rather than
        // one repeated token. A Babylon cylinder at tessellation 6 IS a hex
        // prism, and it arrives flat-top, matching HoneycombField's geometry.
        const cellDepths = [0.18, 0.32, 0.5, 0.26] as const;

        for (let i = 0; i < 26; i++) {
            const size = 0.22 + Math.random() * 0.5;
            const mesh = MeshBuilder.CreateCylinder(
                `p${i}`,
                {
                    diameter: size,
                    height: size * cellDepths[i % cellDepths.length],
                    tessellation: 6,
                },
                scene,
            );

            mesh.material = i % 3 === 0 ? solidMat : wireMat;

            // Lay the prism on its side so the hexagonal face points at the
            // camera — a cylinder is built standing up, which would show the
            // extrusion edge-on and read as a bar.
            mesh.rotation.x = Math.PI / 2;

            // Scatter in 3D space
            const spread = 14;
            mesh.position.x = (Math.random() - 0.5) * spread;
            mesh.position.y = (Math.random() - 0.5) * spread * 0.6;
            mesh.position.z = (Math.random() - 0.5) * spread;

            mesh.rotation.x += (Math.random() - 0.5) * 0.9;
            mesh.rotation.y = Math.random() * Math.PI;

            particles.push({
                mesh,
                baseY: mesh.position.y,
                floatSpeed: 0.3 + Math.random() * 0.5,
                floatAmp: 0.3 + Math.random() * 0.6,
                rotSpeed: {
                    x: (Math.random() - 0.5) * 0.003,
                    y: (Math.random() - 0.5) * 0.004,
                    z: (Math.random() - 0.5) * 0.002,
                },
            });
        }

        // Animation loop — capped at 30fps for performance
        let lastTime = 0;
        const frameInterval = 1000 / 30;
        let elapsed = 0;

        engine.runRenderLoop(() => {
            const now = performance.now();
            const delta = now - lastTime;

            if (delta < frameInterval) return;
            lastTime = now - (delta % frameInterval);
            elapsed += delta / 1000;

            if (!isStill()) {
                for (const p of particles) {
                    p.mesh.position.y = p.baseY + Math.sin(elapsed * p.floatSpeed) * p.floatAmp;
                    p.mesh.rotation.x += p.rotSpeed.x;
                    p.mesh.rotation.y += p.rotSpeed.y;
                    p.mesh.rotation.z += p.rotSpeed.z;
                }
                camera.alpha += 0.0003;
            }

            scene.render();
        });

        const handleResize = () => engine.resize();
        window.addEventListener("resize", handleResize);

        // Pause when offscreen
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    engine.stopRenderLoop();
                    engine.runRenderLoop(() => {
                        const now = performance.now();
                        const delta = now - lastTime;
                        if (delta < frameInterval) return;
                        lastTime = now - (delta % frameInterval);
                        elapsed += delta / 1000;
                        if (!isStill()) {
                            for (const p of particles) {
                                p.mesh.position.y = p.baseY + Math.sin(elapsed * p.floatSpeed) * p.floatAmp;
                                p.mesh.rotation.x += p.rotSpeed.x;
                                p.mesh.rotation.y += p.rotSpeed.y;
                                p.mesh.rotation.z += p.rotSpeed.z;
                            }
                            camera.alpha += 0.0003;
                        }
                        scene.render();
                    });
                } else {
                    engine.stopRenderLoop();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(canvas);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", handleResize);
            engine.stopRenderLoop();
            scene.dispose();
            engine.dispose();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.45 }}
        />
    );
};
