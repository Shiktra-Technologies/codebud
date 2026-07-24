import type { Metadata } from "next";
import { fontVariables } from "@/fonts";
import { HoneycombField } from "@/components/HoneycombField";
import "@/styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
    title: "MYCODEBUD — Learn to Code. Build the Future.",
    description:
        "From zero to hero — MYCODEBUD is your companion on the journey from coding basics to advanced development. Interactive lessons, real projects, and a thriving community.",
    keywords: [
        "learn to code",
        "coding courses",
        "react tutorial",
        "full-stack development",
        "coding bootcamp",
        "programming for beginners",
        "MYCODEBUD",
    ],
    authors: [{ name: "Shiktra Technologies LLP" }],
    openGraph: {
        title: "MYCODEBUD — Learn to Code. Build the Future.",
        description:
            "Interactive coding courses, real-world projects, and AI-powered feedback. Join 10,000+ developers building the future.",
        siteName: "MYCODEBUD",
        type: "website",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "MYCODEBUD — Learn to Code. Build the Future.",
        description:
            "Interactive coding courses, real-world projects, and AI-powered feedback. Join 10,000+ developers.",
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`dark ${fontVariables}`}>
            <body className="min-h-screen text-foreground font-sans selection:bg-primary selection:text-primary-foreground antialiased">
                <HoneycombField />
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
