"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import HeroStage from "@/components/HeroStage";
import SiteHeader from "@/components/SiteHeader";
import AboutVisit from "@/components/Studio/AboutVisit";
import ContactVisit from "@/components/Studio/ContactVisit";
import PhoneButton from "@/components/Studio/PhoneButton";
import StudioScene from "@/components/Studio/StudioScene";
import StudioTable from "@/components/Studio/StudioTable";
import { useVisit } from "@/components/Studio/useVisit";
import { ABOUT_T, CONTACT_T, inOut, pickUp, within } from "@/components/Studio/visitTimeline";
import { SCROLL_SCREENS } from "@/components/Studio/worldStates";
import ProjectShell from "@/components/Projects/ProjectShell";
import ProjectTransitionLayer from "@/components/Projects/ProjectTransitionLayer";
import { useProjectTransition } from "@/components/Projects/useProjectTransition";
import { clamp01 } from "@/components/Projects/transitionGeometry";
import { useWorld } from "@/hooks/useWorld";
import { PROJECTS } from "@/data/projectsData";

/**
 * The portfolio: one place, Rosario's studio, seen through one camera that
 * the page's scroll brings down from her name and the cap to the desk (see
 * Studio/worldStates). Everything is reached from the desk's objects: the
 * books open her projects into their own worlds, the cap opens Rosario
 * herself (About), her telephone the way to reach her (Contact); each closes
 * back onto its object. The navigation picks up the same objects.
 */
export default function Home() {
  const stickyRef = useRef<HTMLDivElement>(null);
  const svhRef = useRef<HTMLDivElement>(null);
  const world = useWorld(stickyRef, svhRef);
  const visit = useVisit(world);

  // Opening a desk object: the object lifts towards the viewer while the
  // studio recedes behind it (blur, dim, a slight pull-back), then the
  // project takes over. The studio stays mounted underneath the whole time.
  const transition = useProjectTransition();
  const { t, reducedMotion, phase, active, shellMounted } = transition;

  // How far the room has receded: behind a project, or behind a visit (About
  // dims it most: the light goes down around her). A call (Contact) keeps the
  // room: its light only draws in a little, behind her card (see ContactVisit).
  const callLight = useTransform(() => {
    const v = visit.contact.get();
    return reducedMotion ? within(v, [0, 1]) : inOut(within(v, CONTACT_T.light));
  });
  const phoneConnected = useTransform(() => {
    const v = visit.contact.get();
    return reducedMotion ? within(v, [0, 0.5]) : within(v, CONTACT_T.crest);
  });
  const deskWords = useTransform(callLight, (v) => 1 - v);
  const room = useTransform(() => {
    const p = clamp01(t.get());
    const a = inOut(within(visit.about.get(), ABOUT_T.recede));
    const c = callLight.get();
    return { blur: Math.max(5 * p, 8 * a), dim: 1 - (1 - 0.45 * p) * (1 - 0.7 * a) * (1 - 0.16 * c), pull: Math.max(p, a) };
  });
  const filterOf = (k: { blur: number; dim: number }) =>
    k.blur === 0 && k.dim === 0 ? "none" : reducedMotion ? `brightness(${(1 - k.dim).toFixed(3)})` : `blur(${k.blur.toFixed(2)}px) brightness(${(1 - k.dim).toFixed(3)})`;
  const roomFilter = useTransform(room, filterOf);
  const roomScale = useTransform(room, (k) => (reducedMotion ? 1 : 1 - 0.035 * k.pull));
  // The cap is not in the room when it is held up (About): it recedes only with a project.
  const capFilter = useTransform(t, (v) => filterOf({ blur: 5 * clamp01(v), dim: 0.45 * clamp01(v) }));
  const capScale = useTransform(t, (v) => (reducedMotion ? 1 : 1 - 0.035 * clamp01(v)));
  // The navigation gives way to a project or a visit (each has its own way back).
  const headerOpacity = useTransform(() => 1 - clamp01(Math.max(t.get() * 1.5, visit.about.get() * 4, visit.contact.get() * 4)));

  // Her telephone: present once the camera is on the desk (or leaning in to it). A hand near it (pointer,
  // keyboard focus) lifts its handset a little; answering it (Contact) takes the handset off the cradle.
  const phoneShown = useTransform(() => Math.max(within(world.s.get(), [0.3, 0.75]), Math.min(1, world.aim.get() * 3)));
  const [phoneNear, setPhoneNear] = useState(false);
  const reach = useMotionValue(0);
  useEffect(() => {
    const c = animate(reach, phoneNear ? 1 : 0, phoneNear ? { type: "spring", duration: 0.4, bounce: 0.2 } : { duration: 0.3, ease: [0.23, 1, 0.32, 1] });
    return () => c.stop();
  }, [phoneNear, reach]);
  const phoneLift = useTransform(() => (reducedMotion ? 0 : Math.max(reach.get() * 0.2, pickUp(within(visit.contact.get(), CONTACT_T.answer)))));

  // Her portrait is fetched once the desk is reached, so it is at hand when the cap is picked up.
  const [nearDesk, setNearDesk] = useState(false);
  const [atDesk, setAtDesk] = useState(false);
  useMotionValueEvent(world.s, "change", (v) => {
    if (v > 0.6) setNearDesk(true);
    setAtDesk(v > 0.92);
  });

  const busy = phase !== "idle" || visit.phase !== "idle";
  // It rings while the desk is the subject, with nothing open and no hand near it (a hand that leaves
  // lets it ring again, after a moment), until it has been answered once in this visit to the site;
  // not in a hidden tab. With reduced motion it does not move: its dial's crest takes her colour instead.
  const [answered, setAnswered] = useState(false);
  if (visit.current === "contact" && !answered) setAnswered(true);
  const [pageShown, setPageShown] = useState(true);
  useEffect(() => {
    const on = () => setPageShown(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const ringing = atDesk && !busy && !answered && !phoneNear && pageShown;
  return (
    <main
      className="relative bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-diva-pink)] selection:text-white"
      style={{ height: `${(SCROLL_SCREENS + 1) * 100}vh` }}
    >
      {/* First in reading order; fixed over the scene. */}
      <SiteHeader world={world} visit={visit} opacity={headerOpacity} inert={busy} />

      {/* The studio, pinned while the page scrolls through it */}
      <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden bg-[#1a1612]">
        <div className="absolute inset-0" inert={busy}>
          <motion.div className="absolute inset-0" style={{ filter: roomFilter, scale: roomScale }}>
            <StudioScene
              world={world}
              onSelectProject={transition.open}
              liftedId={transition.liftedId}
              phoneShown={phoneShown}
              phoneLift={phoneLift}
              phoneRinging={ringing}
              phoneConnected={phoneConnected}
              callLight={callLight}
            />
            {/* The desk's own words give way while a call is on (the wall is her card then). */}
            <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: deskWords }}>
              <StudioTable world={world} />
            </motion.div>
          </motion.div>
          <motion.div className="absolute inset-0 pointer-events-none" style={{ filter: capFilter, scale: capScale }}>
            <HeroStage world={world} visit={visit} />
          </motion.div>
          <PhoneButton world={world} visit={visit} shown={phoneShown} onNear={setPhoneNear} />
        </div>
        {/* The height surely visible with a phone's browser bars showing */}
        <div ref={svhRef} aria-hidden className="absolute left-0 top-0 w-px invisible pointer-events-none" style={{ height: "100svh" }} />
      </div>

      {(nearDesk || visit.current === "about") && <AboutVisit visit={visit} />}
      <ContactVisit visit={visit} world={world} callLight={callLight} />

      <ProjectTransitionLayer transition={transition} />
      {active && shellMounted && PROJECTS[active.id] && (
        <ProjectShell project={PROJECTS[active.id]} transition={transition} />
      )}
    </main>
  );
}
