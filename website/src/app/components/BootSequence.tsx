"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

export default function BootSequence({ children }: { children: React.ReactNode }) {
    const [isBooting, setIsBooting] = useState(true);

    useEffect(() => {
        // Play the boot sequence for exactly 3 seconds on mount
        const timer = setTimeout(() => {
            setIsBooting(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {isBooting && <LoadingScreen />}
            <div
                className={`transition-opacity duration-1000 ease-in-out ${isBooting ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
            >
                {children}
            </div>
        </>
    );
}
