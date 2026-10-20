import type { Metadata } from "next";
import { fontVariables } from "@/fonts";
import { HoneycombField } from "@/components/HoneycombField";
import HoneyCursor from "@/components/HoneyCursor";
import "@/styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
    title: "MYCODEBUD — Proof, not paperwork.",
    description:
        "A career and capability-building ecosystem for engineering students — guidance, mentorship, projects, DSA, hackathons and placement support. A Shiktra Technologies LLP venture.",
    keywords: [
        "engineering student placement",
        "DSA practice",
        "interview preparation",
        "student mentorship",
        "hackathon support",
        "novelty projects",
        "campus placement India",
        "MYCODEBUD",
    ],
    authors: [{ name: "Shiktra Technologies LLP" }],
    openGraph: {
        title: "MYCODEBUD — Proof, not paperwork.",
        description:
            "Guidance, mentorship, novelty-first projects, placement-aligned DSA and hackathon support — ₹99 a month. A Shiktra Technologies LLP venture.",
        siteName: "MYCODEBUD",
        type: "website",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "MYCODEBUD — Proof, not paperwork.",
        description:
            "Guidance, mentorship, novelty-first projects, placement-aligned DSA and hackathon support — ₹99 a month. A Shiktra Technologies LLP venture.",
    },
    robots: {
        index: true,
        follow: true,
    },
    // Favicon set via the app-dir convention (app/favicon.ico + icon.png + apple-icon.png).
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
                <HoneyCursor />
            </body>
        </html>
    );
}
