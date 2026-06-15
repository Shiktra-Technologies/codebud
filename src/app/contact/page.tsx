import type { Metadata } from "next";
import { ContactPage } from "./ContactPage";

export const metadata: Metadata = {
    title: "Contact — CODE BUD",
    description:
        "Get in touch with the CODE BUD team. We'd love to hear from you — whether it's feedback, partnerships, or just saying hello.",
    openGraph: {
        title: "Contact — CODE BUD",
        description:
            "Get in touch with the CODE BUD team. We'd love to hear from you.",
    },
};

export default function Page() {
    return <ContactPage />;
}
