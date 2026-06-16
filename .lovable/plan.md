
## Pass 1 (Reveal) — Result reveal for guided creation

Scope: presentation only, confined to `src/modules/creation/`. No schema, no engine logic, no edge-function changes, no commerce UI.

---

### Current behaviour report (as requested)

**Does `fireGenerate` handle the returned result and errors?**
Yes. In `useCreationJourney.ts`, `fireGenerate`:
- Sets `busy = true`, clears `error`.
- Awaits `generate({ spec, prompt: '', style, labels })`.
- On `res.error`: stores `error` and `result` (so `result.limitReached`/`error` are surfaced).
- On success: stores `result`, then attempts to patch the latest `generated_images` row with `child_given_name`, `authored_by='child'`, and `spec` (with `authorshipSummary` nested) using a service-less authed update. Calls `onComplete?.(res, spec)`.
- On thrown error: sets `error` and a `{ image:'', error }` result.
- `finally`: `busy = false`.

The hook already exposes `result`, `error`, `busy`. **However `CreativeJourney.tsx` does NOT pass `onComplete`**, so no app-level reaction fires; the reveal must come from inside `CreationJourney.tsx`. The reveal block exists today (`j.result && j.result.image && !j.error`) but is small, inline-right, and easy to miss — that's the bug the user is reporting.

**What does `generate-image` return?**
- Success: `{ image: <base64 data-url or signed url>, description, saved: boolean, cached: boolean, storedPath }`.
- Cache hit: `{ image: <signedUrl>, saved: true, cached: true }`.
- Failure: HTTP non-2xx with `{ error: string }` (e.g. 400 prompt rejection, 401 auth, 402/403 credits, 429 rate, 500 generic).

**Is the artifact saved to `generated_images`?**
Yes, when `saveToGallery: true` (the adapter always sends true) AND the user is authenticated:
1. Edge function uploads the PNG to the `generated-images` storage bucket.
2. Inserts a row with `user_id`, `prompt`, `style`, `image_url` (= storage path).
3. Returns `saved: true`.
4. Back in the hook, `fireGenerate` then patches that latest row with `child_given_name`, `authored_by='child'`, and the full `spec` JSONB (now including `authorshipSummary`).

So the persistence chain is already correct — the only failure mode is the silent / cramped reveal.

---

### Changes

**1. `src/modules/creation/CreationJourney.tsx`** — replace the small inline result block with a full reveal stage that takes over the layout when `j.result` exists.

When `j.result` is present, render a single-column reveal (no preview pane) instead of the two-column step layout:

- **Loading** is already handled in the preview pane (Pass from previous turn). No change.
- **Success (`j.result.image && !j.result.error`)**:
  - Large, centred image inside a glowing `#5BCEFA/40` rounded frame, max-width ~640px, full width on mobile, aspect-square (`object-contain`, `bg-[#0A1A3D]`).
  - Title: `j.spec.childGivenName` rendered in `font-display text-4xl sm:text-5xl text-white` centred above the image.
  - Subtitle: `j.result.authorshipSummary` (fallback: `"You made this."`) in `text-[#B8A4E3] text-base sm:text-lg` centred below the image.
  - Action row (centred, stacked on mobile):
    - **View in Gallery** — primary `#5BCEFA` button, `navigate('/creative-journey')` then sets `showGallery` — see step 3 for wiring.
    - **Make another** — secondary outline button, calls `j.reset()`.
  - Accessible: `role="region"` `aria-label="Your creation"`, focus moved to the heading on mount via a `useEffect` + `ref` (slow-pacing rule respected — no flashy entrance, just a 600ms opacity fade-in via Tailwind `animate-in fade-in` with `duration-500`).
- **Error / empty image (`j.error || (j.result && !j.result.image)`)** and NOT `limitReached`:
  - Friendly card: heading "That didn't come through", body shows `j.error` (sanitised) or a default `"Something interrupted the spark. Let's try again."`.
  - **Retry** button — calls `j.reset()` followed by jumping straight back to the claim step (Pass-2 nicety) — for Pass 1, simply call `j.reset()`, which returns the child to step 0 with all choices preserved-by-redo. Simpler alternative used here: add a new `retryGenerate` action — see step 2.
  - **Start over** secondary button — `j.reset()`.
- **Limit reached** — existing block is kept as-is (no commerce changes, but it stays a visible outcome, not a blank screen).

The current right-column preview/two-column grid is rendered only while `!j.result`. Once `j.result` exists, the reveal replaces the whole grid so it is unmissable.

**2. `src/modules/creation/useCreationJourney.ts`** — add a `retryGenerate` callback:
- Clears `result` and `error`, leaves `spec` untouched, then calls `fireGenerate()` again.
- Export it alongside `fireGenerate` and `reset`. No other hook changes.

**3. `src/pages/CreativeJourney.tsx`** — wire the gallery action through `onComplete` is not needed; instead pass a new optional prop `onViewGallery?: () => void` to `<CreationJourney />` and have CreativeJourney supply `() => setShowGallery(true)`. CreationJourney consumes it for the "View in Gallery" button. If the prop is not provided, the button falls back to `navigate('/creative-journey')`. (One-line page change; the rest of the page is untouched.)

**4. `src/modules/creation/PreviewStack.tsx`** — no change. The busy overlay added previously already covers the loading state during `fireGenerate`.

---

### Acceptance

- Clicking **I MADE THIS** always leads to a visible outcome:
  - Loading overlay in the preview pane while generating.
  - On success → large centred image, child-given name as title, authorship summary beneath, **View in Gallery** + **Make another** actions.
  - On error → friendly message + **Retry** + **Start over**.
- The created image is persisted to `generated_images` with `child_given_name`, `authored_by='child'`, `spec` (incl. `authorshipSummary`), and shows up in the existing gallery/history (unchanged path).
- No silent failures; the reveal replaces the step grid, so the child cannot miss it.
- No schema change, no commerce UI, no engine/choice-logic rewrite, no edge-function edit.
