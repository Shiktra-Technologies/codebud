import type { Metadata } from "next";
import { AboutPage } from "./AboutPage";

export const metadata: Metadata = {
    title: "About — CODE BUD",
    description:
        "Learn about CODE BUD's mission to make coding education accessible, our story, our values, and the team behind the platform.",
    openGraph: {
        title: "About — CODE BUD",
        description:
            "Learn about CODE BUD's mission to make coding education accessible, our story, our values, and the team behind the platform.",
    },
};

export default function Page() {
    return <AboutPage />;
}
