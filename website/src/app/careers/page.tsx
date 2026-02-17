import type { Metadata } from "next";
import { CareersPage } from "./CareersPage";

export const metadata: Metadata = {
    title: "Careers — CODE BUD",
    description:
        "Join the CODE BUD team. We're building the future of coding education and looking for passionate engineers, designers, and educators.",
    openGraph: {
        title: "Careers — CODE BUD",
        description: "Join the CODE BUD team. Build the future of coding education.",
    },
};

export default function Page() {
    return <CareersPage />;
}
