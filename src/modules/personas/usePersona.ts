import { useContext } from "react";
import { PersonaContext, type PersonaContextValue } from "./PersonaContext";

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    // Safe no-op fallback so hook points never crash if provider is missing.
    return {
      activeId: null,
      availableIds: [],
      interests: [],
      affinity: {},
      unlockedBadges: [],
      streak: { count: 0, lastDayISO: null },
      activePersona: null,
      availablePersonas: [],
      styleSuffix: "",
      questContext: null,
      setActive: () => {},
      setAvailable: () => {},
      setInterests: () => {},
      awardAffinity: () => {},
      awardSession: () => ({ newBadges: [] }),
    };
  }
  return ctx;
}
