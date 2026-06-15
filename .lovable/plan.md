
## Scope
Confined to `src/modules/creation/`. No journey-UI structure changes, no engine-hook signature changes, no routing/schema/edge-function changes. The image model and the `generate-image` edge function stay exactly as they are.

Files touched:
- **NEW** `src/modules/creation/descriptors.ts`
- **EDIT** `src/modules/creation/generateAdapter.ts`
- **EDIT** `src/modules/creation/useCreationJourney.ts` (prompt assembly + persistence only)
- **EDIT** `src/modules/creation/CreationJourney.tsx` (surface `authorshipSummary` on the result panel)

No other files change.

---

## 1. `src/modules/creation/descriptors.ts` (new)

Self-contained library. Exports:

- `SAFETY_PREAMBLE` — child-safe scaffold prepended to every prompt (e.g. *"A friendly, age-appropriate illustration for a young creator (ages 10–16). Wholesome, non-violent, fully clothed, no realistic gore, no scary photoreal horror, no sexualised content, no real public figures, no trademarks."*).
- `NEGATIVE_PROMPT` — comma-list of exclusions (nsfw, gore, weapons aimed at people, blood, scary realistic horror, copyrighted characters, watermarks, text artifacts, low quality, deformed anatomy, extra limbs, blurry, jpeg artifacts, etc.).
- `DESCRIPTORS` — keyed map covering every built choice id, grouped by step:
  - `subject`: `creature | place | vehicle | object`
  - `vibe`: `brave | curious | silly | mysterious`
  - `home`: `forest | ocean | space | city`
  - `detail`: `glow | wings | crystals | flames`
  - `style`: `anime | cartoon | watercolor | pixel-art | fantasy | sci-fi`
  
  Each entry: `{ prompt: string, summary: string }`. `prompt` is a rich descriptor sentence used for the model; `summary` is short, child-voice phrasing for the authorship line.
- `STYLE_QUALITY` — per-style quality tail (lighting, composition, render hints) appended only when a style is chosen.
- `sanitizeFreeText(text: string): string` — trims, caps at 200 chars, strips URLs, emails, @mentions, control chars, and a blocklist of unsafe words; returns `""` if nothing remains.
- `CreationChoices` type — `{ subject?, vibe?, home?, detail?, style? }` (keys map 1:1 to engine step ids).
- `composePrompt(spec, opts?)` — accepts the engine's `CreationSpec` directly (reads `spec.choices`, `spec.styleId`, `spec.freeText`, `spec.childGivenName`) plus optional `{ labels?: Record<string,string> }` (the JourneyChoice labels per stepId). Returns:
  ```
  { prompt: string; negativePrompt: string; authorshipSummary: string; usedFallback: boolean }
  ```
  - `prompt` = `SAFETY_PREAMBLE` + assembled descriptor sentences (subject → vibe → home → detail) + style descriptor + `STYLE_QUALITY[style]` + sanitised free text (clearly delimited as "additional child note: …") + closing quality tail.
  - `negativePrompt` = `NEGATIVE_PROMPT`.
  - `authorshipSummary` = one or two sentences in the child's voice, using the provided `labels` when available, e.g. *"Mira made a brave creature that lives in space, with glowing markings, drawn in anime style."*
  - `usedFallback = true` if any chosen id had no descriptor entry (should not happen after reconciliation, but defensive).

Reconciliation rule: every built choice id in `definitions/generalCreate.ts` and every style id in `CreationJourney.STYLE_OPTIONS` has a matching entry. If a future choice is added with no descriptor, `composePrompt` falls back to a clean templated sentence using the label (never a bare id) and flips `usedFallback`.

---

## 2. `src/modules/creation/generateAdapter.ts` (edit)

- Stop accepting a pre-assembled `prompt` string for assembly purposes. Adapter still implements the existing `GenerateFn` signature (so the hook contract is unchanged), but internally it now:
  1. Receives `{ spec, prompt, style }` from the hook.
  2. Calls `composePrompt(spec, { labels })` to get `{ prompt: finalPrompt, negativePrompt, authorshipSummary }`.
  3. Since the edge function does **not** accept a `negativePrompt` field and we are explicitly not changing it, append the exclusions inline:  
     `finalPrompt + "\n\nAvoid: " + negativePrompt`.
  4. Invokes `generate-image` with `{ prompt: finalPrompt + exclusions, style: spec.styleId ?? undefined, saveToGallery: true }`.
  5. Returns `{ image, saved, cached, authorshipSummary }` on success (extends `GenerateResult` with optional `authorshipSummary`). Error/limit-reached handling unchanged.

Labels are derived inside the adapter by walking `spec.choices` against the journey definition. To keep the adapter generic, expose a small helper or accept a `labels` map via the hook (see step 3).

---

## 3. `src/modules/creation/useCreationJourney.ts` (edit, minimal)

- Replace the local `assemblePrompt` with a thin pass-through that computes a `labels` map (`{ [stepId]: choice.label }`) by walking `definition.steps` and the current `spec.choices`. The hook still calls `generate({ spec, prompt: "", style })` — the adapter is now the source of truth for prompt text — but the hook also passes `labels` through. Simplest path: extend `GenerateInput` with `labels?: Record<string,string>`.
- Extend `GenerateResult` typing to include `authorshipSummary?: string` (in `types.ts`).
- In `fireGenerate`, after a successful `generate(...)`:
  - Merge `authorshipSummary` into the `spec` JSONB written via the existing post-insert `UPDATE` on `generated_images` (`spec: { ...spec, authorshipSummary }`). No schema change; it nests inside the existing `spec` column.
  - Store `authorshipSummary` on the in-memory `result` so the UI can show it.

`assemblePrompt` is removed from the public hook return (no external callers besides the component itself).

---

## 4. `src/modules/creation/CreationJourney.tsx` (edit, surface only)

In the success branch (where `j.result.image` is rendered), add a short caption beneath the image:

```tsx
{j.result.authorshipSummary && (
  <p className="text-sm text-[#B8A4E3]">{j.result.authorshipSummary}</p>
)}
```

No layout, no copy beyond that line. No commerce UI.

---

## Acceptance
- Every generation routes through `composePrompt`; `SAFETY_PREAMBLE` and `NEGATIVE_PROMPT` are applied every time.
- Every choice id in `generalCreate.ts` (subject/vibe/home/detail) and every style id in `CreationJourney`'s `STYLE_OPTIONS` has a descriptor entry; no bare label/id is sent to the model.
- Free text is sanitised via `sanitizeFreeText` before being added to the prompt.
- `authorshipSummary` is stored inside the existing `spec` JSONB column (no schema change) and shown on the result screen.
- The single-prompt textarea, Quick Prompts, and any commerce UI in the flow remain absent.
- No edits outside `src/modules/creation/`.
