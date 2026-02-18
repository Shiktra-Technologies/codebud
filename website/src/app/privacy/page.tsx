import type { Metadata } from "next";
import { PrivacyPage } from "./PrivacyPage";

export const metadata: Metadata = {
    title: "Privacy Policy — CODE BUD",
    description:
        "Learn how CODE BUD collects, uses, and protects your personal data. Your privacy matters to us.",
    openGraph: {
        title: "Privacy Policy — CODE BUD",
        description: "Learn how CODE BUD collects, uses, and protects your personal data.",
    },
};

export default function Page() {
    return <PrivacyPage />;
}
