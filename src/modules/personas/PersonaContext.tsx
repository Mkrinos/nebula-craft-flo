import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  PERSONAS,
  type Interest,
  type PersonaConfig,
  type PersonaId,
  ALL_INTERESTS,
  getPersona,
} from "./personas.config";
import { BADGES, badgesUnlockedFor } from "./badges";

const STORAGE_KEY = "nt.personas.v1";

interface StreakState {
  count: number;
  lastDayISO: string | null;
}

interface PersistedState {
  activeId: PersonaId | null;
  availableIds: PersonaId[];
  interests: Interest[];
  affinity: Partial<Record<PersonaId, number>>;
  unlockedBadges: string[];
  streak: StreakState;
}

const DEFAULT_STATE: PersistedState = {
  activeId: null,
  availableIds: PERSONAS.map((p) => p.id),
  interests: [...ALL_INTERESTS],
  affinity: {},
  unlockedBadges: [],
  streak: { count: 0, lastDayISO: null },
};

function loadState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / privacy mode — silently ignore */
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso + "T00:00:00Z");
  const today = new Date(todayISO() + "T00:00:00Z");
  const diff = (today.getTime() - d.getTime()) / 86_400_000;
  return diff === 1;
}

export interface PersonaContextValue {
  // raw state
  activeId: PersonaId | null;
  availableIds: PersonaId[];
  interests: Interest[];
  affinity: Partial<Record<PersonaId, number>>;
  unlockedBadges: string[];
  streak: StreakState;
  // derived
  activePersona: PersonaConfig | null;
  availablePersonas: PersonaConfig[];
  /** Short string appended to image prompts. */
  styleSuffix: string;
  /** Short extra context for quest LLM call. */
  questContext: { personaVoice: string; interests: Interest[] } | null;
  // actions
  setActive: (id: PersonaId) => void;
  setAvailable: (ids: PersonaId[]) => void;
  setInterests: (interests: Interest[]) => void;
  awardAffinity: (amount?: number, personaId?: PersonaId) => void;
  /** Call on session end: bumps affinity, recomputes streak, unlocks pending badges. */
  awardSession: () => { newBadges: string[] };
}

export const PersonaContext = createContext<PersonaContextValue | null>(null);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setActive = useCallback((id: PersonaId) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const setAvailable = useCallback((ids: PersonaId[]) => {
    setState((s) => {
      const activeStillAvailable = s.activeId && ids.includes(s.activeId);
      return {
        ...s,
        availableIds: ids,
        activeId: activeStillAvailable ? s.activeId : null,
      };
    });
  }, []);

  const setInterests = useCallback((interests: Interest[]) => {
    setState((s) => ({ ...s, interests }));
  }, []);

  const recomputeBadges = (affinity: Partial<Record<PersonaId, number>>): string[] => {
    const out: string[] = [];
    for (const pid of Object.keys(affinity) as PersonaId[]) {
      for (const b of badgesUnlockedFor(pid, affinity[pid] ?? 0)) out.push(b.id);
    }
    return Array.from(new Set(out));
  };

  const awardAffinity = useCallback((amount = 1, personaId?: PersonaId) => {
    setState((s) => {
      const target = personaId ?? s.activeId;
      if (!target) return s;
      const nextAffinity = {
        ...s.affinity,
        [target]: (s.affinity[target] ?? 0) + amount,
      };
      const nextBadges = recomputeBadges(nextAffinity);
      return { ...s, affinity: nextAffinity, unlockedBadges: nextBadges };
    });
  }, []);

  const awardSession = useCallback((): { newBadges: string[] } => {
    let newBadges: string[] = [];
    setState((s) => {
      const today = todayISO();
      const last = s.streak.lastDayISO;
      let nextStreak: StreakState;
      if (last === today) {
        nextStreak = s.streak; // already counted today
      } else if (isYesterday(last)) {
        nextStreak = { count: s.streak.count + 1, lastDayISO: today };
      } else {
        nextStreak = { count: 1, lastDayISO: today };
      }
      const target = s.activeId;
      if (!target) return { ...s, streak: nextStreak };
      const nextAffinity = {
        ...s.affinity,
        [target]: (s.affinity[target] ?? 0) + 1,
      };
      const allBadges = recomputeBadges(nextAffinity);
      newBadges = allBadges.filter((b) => !s.unlockedBadges.includes(b));
      return {
        ...s,
        affinity: nextAffinity,
        unlockedBadges: allBadges,
        streak: nextStreak,
      };
    });
    return { newBadges };
  }, []);

  const value = useMemo<PersonaContextValue>(() => {
    const active = getPersona(state.activeId);
    const availablePersonas = PERSONAS.filter((p) => state.availableIds.includes(p.id));
    return {
      ...state,
      activePersona: active,
      availablePersonas,
      styleSuffix: active
        ? ` (in the style of ${active.shortName}: ${active.styleDescriptor}; child interests: ${state.interests.join(", ")})`
        : "",
      questContext: active
        ? { personaVoice: active.questVoice, interests: state.interests }
        : null,
      setActive,
      setAvailable,
      setInterests,
      awardAffinity,
      awardSession,
    };
  }, [state, setActive, setAvailable, setInterests, awardAffinity, awardSession]);

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
};

export { BADGES };
