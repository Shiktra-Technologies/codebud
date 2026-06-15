import type { Metadata } from "next";
import { PrivacyPage } from "./PrivacyPage";

export const metadata: Metadata = {
    title: "Privacy Policy — MYCODEBUD",
    description:
        "Learn how MYCODEBUD collects, uses, and protects your personal data. Your privacy matters to us.",
    openGraph: {
        title: "Privacy Policy — MYCODEBUD",
        description: "Learn how MYCODEBUD collects, uses, and protects your personal data.",
    },
};

export default function Page() {
    return <PrivacyPage />;
}
