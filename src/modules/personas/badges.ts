import type { PersonaId } from "./personas.config";

export const AFFINITY_THRESHOLDS = [10, 25, 50] as const;

export interface BadgeDef {
  id: string;
  personaId: PersonaId;
  threshold: number;
  title: string;
}

const COPY: Record<PersonaId, [string, string, string]> = {
  nova: ["Nova's First Spark", "Nova's Bright Path", "Nova's Radiant Bond"],
  ember: ["Ember's First Flame", "Ember's Brave Heart", "Ember's Solar Champion"],
  lyra: ["Lyra's First Whisper", "Lyra's Soft Song", "Lyra's Dream Companion"],
  vex: ["Vex's First Spark", "Vex's Neon Grin", "Vex's Glitch Twin"],
  halo: ["Halo's First Dawn", "Halo's Steady Watch", "Halo's Guardian Bond"],
  onyx: ["Onyx's First Shadow", "Onyx's Quiet Star", "Onyx's Void Kin"],
};

export const BADGES: BadgeDef[] = (Object.keys(COPY) as PersonaId[]).flatMap((pid) =>
  AFFINITY_THRESHOLDS.map((threshold, i) => ({
    id: `${pid}.${threshold}`,
    personaId: pid,
    threshold,
    title: COPY[pid][i],
  })),
);

export function badgesUnlockedFor(personaId: PersonaId, affinity: number): BadgeDef[] {
  return BADGES.filter((b) => b.personaId === personaId && affinity >= b.threshold);
}
