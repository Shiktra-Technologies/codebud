import type { Metadata } from "next";
import { ContactPage } from "./ContactPage";

export const metadata: Metadata = {
    title: "Contact — MYCODEBUD",
    description:
        "Get in touch with the MYCODEBUD team. We'd love to hear from you — whether it's feedback, partnerships, or just saying hello.",
    openGraph: {
        title: "Contact — MYCODEBUD",
        description:
            "Get in touch with the MYCODEBUD team. We'd love to hear from you.",
    },
};

export default function Page() {
    return <ContactPage />;
}
