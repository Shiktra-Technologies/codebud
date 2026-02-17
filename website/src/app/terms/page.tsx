import type { Metadata } from "next";
import { TermsPage } from "./TermsPage";

export const metadata: Metadata = {
    title: "Terms of Service — CODE BUD",
    description:
        "Read the terms and conditions governing your use of the CODE BUD platform, courses, and services.",
    openGraph: {
        title: "Terms of Service — CODE BUD",
        description: "Terms and conditions for using the CODE BUD platform.",
    },
};

export default function Page() {
    return <TermsPage />;
}
