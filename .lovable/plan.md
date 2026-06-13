
# Persona Module — Implementation Plan

Awaiting your confirmation before writing any code. Two items need your sign-off at the bottom.

## Stack note (please confirm)
Your brief describes Next.js 15 / React 19, but this project is **Vite + React 18 + react-router-dom**. I will follow the same architectural intent (self-contained module, context, hook, three additive hook points) using the existing stack. No framework migration.

---

## 1. Asset placement & filename → persona mapping

Uploaded files will be placed in `public/personas/` (renamed to URL-safe form). Proposed mapping:

| Uploaded file | Persona id | Display name |
|---|---|---|
| Nova Sun-Mystic.mp4 → `public/personas/nova.mp4` | `nova` | Nova, the Sun-Mystic |
| Ember Solar-Warrior.mp4 → `public/personas/ember.mp4` | `ember` | Ember, the Solar Warrior |
| Lyra Soft-Dreamer.mp4 → `public/personas/lyra.mp4` | `lyra` | Lyra, the Soft Dreamer |
| Vex Neon-Trickster.mp4 → `public/personas/vex.mp4` | `vex` | Vex, the Neon Trickster |
| Halo Dawn-Sentinel.mp4 → `public/personas/halo.mp4` | `halo` | Halo, the Dawn Sentinel |
| Onyx Void-Sculptor.mp4 → `public/personas/onyx.mp4` | `onyx` | Onyx, the Void Sculptor |

Per-persona config (style descriptor, palette accent, voice ID placeholder string, interest affinities) drafted as:

- **Nova** — radiant golden mysticism · interests: space, mystery, art
- **Ember** — bold solar action · interests: fantasy, science, animals
- **Lyra** — soft dreamy pastel · interests: music, nature, animals
- **Vex** — neon playful trickster · interests: art, music, mystery
- **Halo** — luminous guardian dawn · interests: nature, fantasy, space
- **Onyx** — cosmic shadow sculptor · interests: science, mystery, space

Interest vocabulary: `animals, space, fantasy, mystery, art, science, music, nature`.

---

## 2. New files (all inside `src/modules/personas/`)

```text
src/modules/personas/
  personas.config.ts          # typed PERSONAS array + INTERESTS list + types
  PersonaContext.tsx          # provider: active persona, affinity, badges, streak; persists to localStorage under one key "nt.personas.v1"
  usePersona.ts               # hook: { activePersona, interests, availableIds, setActive, awardAffinity, getBadges, streak }
  PersonaSelectScreen.tsx     # child-facing grid, ordered by interest fit, tap-to-preview video, "choose this guide"
  GuardianPersonaGate.tsx     # guardian-only config: persona availability toggles + interest checkboxes
  badges.ts                   # thresholds (10/25/50) + per-persona badge copy
  index.ts                    # barrel export
```

Persistence: single key `nt.personas.v1` in the existing localStorage layer. Shape:
```ts
{ activeId, availableIds[], interests[], affinity: Record<id, number>, unlockedBadges: string[], streak: { count, lastDayISO } }
```

Routes registered (additive only, in `src/App.tsx` route table — this is a 4th touch; **flagging it explicitly**, see §4):
- `/personas/select` → `PersonaSelectScreen`
- `/guardian/personas` → `GuardianPersonaGate` (wrapped in existing guardian auth guard)

The `PersonaProvider` will be mounted once at the app root inside the existing provider tree.

---

## 3. Hook points in existing files (one import + one call each)

| File | Exact one-line change |
|---|---|
| **`src/pages/CreativeJourney.tsx`** (image creation) | `const { styleSuffix } = usePersona();` and append `styleSuffix` to the existing prompt string before the generate call. |
| **`src/pages/Quests.tsx`** (quest component) | `const { questContext } = usePersona();` and pass `questContext` as an extra field in the existing LLM call body. |
| **Session-end screen** — **need confirmation**: I could not locate a clear "session end" file. Candidates: a component inside `src/components/creative-journey/` or `src/components/quests/QuestCompletionCelebration.tsx`. **Please confirm which file is the session-end screen** (or let me grep). The one-line change will be: `const { activePersona, awardSession } = usePersona();` then call `awardSession()` on mount and render `<p>Your guide today was {activePersona.name}</p>`. |

If, during implementation, any of these three files turn out to require more than the import + single call (e.g. the prompt string isn't reachable in one expression), I will stop and ask rather than expand the touch.

---

## 4. Files touched outside the module — explicit list

Per your rule, flagging every existing-file touch:

1. `src/pages/CreativeJourney.tsx` — hook point #1
2. `src/pages/Quests.tsx` — hook point #2
3. *(session-end file, TBD)* — hook point #3
4. **`src/App.tsx`** — register two new routes and mount `<PersonaProvider>`. This is required to make the module reachable; it is structural registration, not behavioral change. **Please approve this 4th touch** — without it the module is unreachable.

No other existing file will be modified. No schema migration. No changes to safety spine, voice integration, Kling, or image API internals.

---

## 5. Gamification rules (inside module only)

- Affinity: `awardAffinity(personaId, 1)` called by hook points on meaningful decisions (one per generate, one per quest completion, one per session end).
- Badges: thresholds 10 / 25 / 50 per persona. Copy drafted (e.g. "Nova's First Spark", "Nova's Bright Path", "Nova's Radiant Bond") — final copy in `badges.ts`.
- Streak: increments when `lastDayISO` is yesterday; resets silently to 1 otherwise. No loss UI.

---

## Please confirm before I write code

1. **Stack substitution** (Vite/React 18/react-router) is acceptable.
2. **Filename → persona mapping** above is correct.
3. **Session-end file** path (or permission to grep and pick).
4. **`src/App.tsx` touch** for route registration + provider mount is approved.

Once you confirm, I'll implement in one pass.
