import type { Metadata } from "next";
import { BlogPage } from "./BlogPage";

export const metadata: Metadata = {
    title: "Blog — CODE BUD",
    description:
        "Insights, tutorials, and updates from the CODE BUD team. Learn web development, best practices, and stay up-to-date with the latest in coding education.",
    openGraph: {
        title: "Blog — CODE BUD",
        description: "Insights, tutorials, and updates from the CODE BUD team.",
    },
};

export default function Page() {
    return <BlogPage />;
}
