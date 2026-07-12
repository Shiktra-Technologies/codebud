import type { Metadata } from "next";
import { BlogPage } from "./BlogPage";

export const metadata: Metadata = {
    title: "Blog — MYCODEBUD",
    description:
        "Insights, tutorials, and updates from the MYCODEBUD team. Learn web development, best practices, and stay up-to-date with the latest in coding education.",
    openGraph: {
        title: "Blog — MYCODEBUD",
        description: "Insights, tutorials, and updates from the MYCODEBUD team.",
    },
};

export default function Page() {
    return <BlogPage />;
}
