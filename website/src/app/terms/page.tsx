import type { Metadata } from "next";
import { TermsPage } from "./TermsPage";

export const metadata: Metadata = {
    title: "Terms of Service — MYCODEBUD",
    description:
        "Read the terms and conditions governing your use of the MYCODEBUD platform, courses, and services.",
    openGraph: {
        title: "Terms of Service — MYCODEBUD",
        description: "Terms and conditions for using the MYCODEBUD platform.",
    },
};

export default function Page() {
    return <TermsPage />;
}
