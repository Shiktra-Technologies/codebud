"use client";

import "lenis/dist/lenis.css";

import { BrassRing } from "./components/home/BrassRing";
import { ContactScene } from "./components/home/ContactScene";
import { FloatingLogo } from "./components/home/FloatingLogo";
import { HeroScene } from "./components/home/HeroScene";
import { JourneyScene } from "./components/home/JourneyScene";
import { LenisProvider } from "./components/home/lenis";
import { ProofScene } from "./components/home/ProofScene";
import { SceneNav } from "./components/home/SceneNav";
import { StoryScene } from "./components/home/StoryScene";
import { TeamScene } from "./components/home/TeamScene";
import { TickerBand } from "./components/home/TickerBand";

/*
 * The homepage is a run of scroll scenes rather than stacked sections: each
 * pinned scene holds the viewport while scroll drives it, then hands over to
 * the next. Order matters — BrassRing and FloatingLogo read the scenes by id,
 * and SceneNav walks the ids listed in content.ts.
 *
 * No Suspense boundaries in here (nor a loading.tsx above): the server
 * streams a large boundary's markup out of order, hidden at the end of the
 * HTML, and the scenes then only appear once a script reveals them.
 */
export default function HomePage() {
    return (
        <LenisProvider>
            <main>
                <HeroScene />
                <StoryScene />
                <TickerBand />
                <JourneyScene />
                <ProofScene />
                <TeamScene />
                <ContactScene />
            </main>
            <BrassRing />
            <FloatingLogo />
            <SceneNav />
        </LenisProvider>
    );
}
