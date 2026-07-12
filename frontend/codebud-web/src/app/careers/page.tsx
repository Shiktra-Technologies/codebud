import type { Metadata } from "next";
import { CareersPage } from "./CareersPage";

export const metadata: Metadata = {
    title: "Careers — MYCODEBUD",
    description:
        "Join the MYCODEBUD team. We're building the future of coding education and looking for passionate engineers, designers, and educators.",
    openGraph: {
        title: "Careers — MYCODEBUD",
        description: "Join the MYCODEBUD team. Build the future of coding education.",
    },
};

export default function Page() {
    return <CareersPage />;
}
