import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@babylonjs/core"],
    compiler: {
        // Strip console.* from production bundles (dev logging stays in dev).
        // Keep error/warn — they're the signal we want from real users.
        removeConsole: process.env.NODE_ENV === "production"
            ? { exclude: ["error", "warn"] }
            : false,
    },
};

export default nextConfig;
