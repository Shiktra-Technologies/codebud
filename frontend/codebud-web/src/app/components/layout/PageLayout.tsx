"use client";

/*
 * The frame for every page that isn't the homepage — built from the
 * homepage's own parts so the whole site reads as one piece:
 *
 *   BrassRing ("page")   the horizon under the header, back again at the end
 *   PageHero             eyebrow · rising statement · lede · facts
 *   children             the page itself
 *   ContactScene         the same finale the homepage ends on
 *   FloatingLogo         beside the title, then into the nav's mark
 *   PageNav              the bottom pill, with pages instead of scenes
 */

import "lenis/dist/lenis.css";

import { BrassRing } from "../home/BrassRing";
import { ContactScene } from "../home/ContactScene";
import { FloatingLogo } from "../home/FloatingLogo";
import { LenisProvider } from "../home/lenis";
import { PageHero, type PageHeroProps } from "../site/PageHero";
import { PageNav } from "../site/PageNav";

interface PageLayoutProps extends PageHeroProps {
    children: React.ReactNode;
    /** End on the contact finale (vision, links, newsletter, horizon). */
    finale?: boolean;
}

export function PageLayout({ children, finale = true, ...hero }: PageLayoutProps) {
    return (
        <LenisProvider>
            <main>
                <PageHero {...hero} />
                {children}
                {finale && <ContactScene />}
            </main>
            <BrassRing variant="page" />
            <FloatingLogo variant="page" />
            <PageNav />
        </LenisProvider>
    );
}
