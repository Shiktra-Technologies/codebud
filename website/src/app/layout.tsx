import type { Metadata } from "next";
import "@/styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
    title: "CODE BUD — Learn to Code. Build the Future.",
    description:
        "From zero to hero — CODE BUD is your companion on the journey from coding basics to advanced development. Interactive lessons, real projects, and a thriving community.",
    keywords: [
        "learn to code",
        "coding courses",
        "react tutorial",
        "full-stack development",
        "coding bootcamp",
        "programming for beginners",
        "CODE BUD",
    ],
    authors: [{ name: "Shiktra Technologies LLP" }],
    openGraph: {
        title: "CODE BUD — Learn to Code. Build the Future.",
        description:
            "Interactive coding courses, real-world projects, and AI-powered feedback. Join 10,000+ developers building the future.",
        siteName: "CODE BUD",
        type: "website",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "CODE BUD — Learn to Code. Build the Future.",
        description:
            "Interactive coding courses, real-world projects, and AI-powered feedback. Join 10,000+ developers.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen bg-surface-0 text-white font-sans selection:bg-yellow-400 selection:text-black antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
