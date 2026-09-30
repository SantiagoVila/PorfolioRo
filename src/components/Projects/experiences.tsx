import type { ComponentType } from "react";
import type { ProjectData } from "@/data/projectsData";

/** What every project experience receives from the shell. */
export interface ExperienceProps {
  project: ProjectData;
  /** Leave the project (flies back to the desk). Experiences may offer their own exits. */
  onClose: () => void;
  /**
   * Hide the shell's "Back to the desk" control while the experience shows its
   * own way up a level (EL DIARIO's stories). Optional; the shell restores it
   * when the experience unmounts.
   */
  setShellControlHidden?: (hidden: boolean) => void;
}

type Experience = ComponentType<ExperienceProps>;

/**
 * Which experience opens for each desk object. Each entry is free to be a
 * completely different component (layout, background, scrolling, media,
 * interactions). CHACARITA, COLORFULL and B&W are books; EL DIARIO is the
 * newspaper that opens into an editorial hub of its three stories.
 *
 * Each is its own chunk, fetched when the desk comes into view
 * (preloadExperiences) and at the latest while the object flies to fill the
 * screen: the transition waits for it (loadExperience) before mounting the
 * project, so the project is never rendered half-loaded.
 */
const LOADERS: Record<string, () => Promise<{ default: Experience }>> = {
  chacarita: () => import("./chacarita/ChacaritaExperience"),
  colorfull: () => import("./colorfull/ColorfullExperience"),
  bw: () => import("./bw/BWExperience"),
  journalism: () => import("./daily/DailyExperience"),
};

const loaded: Record<string, Experience> = {};
const pending: Record<string, Promise<void>> = {};

/** Fetch an experience's code (once); resolves when experienceFor(id) can render it. */
export function loadExperience(id: string): Promise<void> {
  if (loaded[id] || !LOADERS[id]) return Promise.resolve();
  pending[id] ??= LOADERS[id]().then(
    (m) => {
      loaded[id] = m.default;
    },
    (error) => {
      delete pending[id]; // let a later attempt retry
      throw error;
    },
  );
  return pending[id];
}

export function preloadExperiences() {
  for (const id of Object.keys(LOADERS)) loadExperience(id).catch(() => {});
}

/** The experiences loaded so far, by project id. */
export const EXPERIENCES: Readonly<Record<string, Experience>> = loaded;
