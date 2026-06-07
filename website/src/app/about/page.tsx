import type { Metadata } from "next";
import { AboutPage } from "./AboutPage";

export const metadata: Metadata = {
    title: "About — MYCODEBUD",
    description:
        "Learn about MYCODEBUD's mission to make coding education accessible, our story, our values, and the team behind the platform.",
    openGraph: {
        title: "About — MYCODEBUD",
        description:
            "Learn about MYCODEBUD's mission to make coding education accessible, our story, our values, and the team behind the platform.",
    },
};

export default function Page() {
    return <AboutPage />;
}
