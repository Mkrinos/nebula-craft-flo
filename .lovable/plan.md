
## Goal
Introduce a standalone, tap-driven cumulative creation flow that Create and Quick Generate both consume, persisting to the existing `generated_images` columns (`spec`, `child_given_name`, `authored_by`). Additive only — no schema changes, no new routes.

## Files involved (discovery)

**(a) Create screen**
- `src/pages/CreativeJourney.tsx` (host)
- `src/components/creative-journey/CreativeJourneyTour.tsx`
- `src/components/PromptEnhancer.tsx`, `ImageGenerationSkeleton.tsx`, `ImageGallery.tsx`, `VoiceInputButton.tsx`

**(b) Quick Generate panel**
- `src/components/dashboard/QuickGenerateWidget.tsx`
- `src/components/dashboard/DashboardWidget.tsx` (wrapper, untouched)

**(c) Image generation function**
- `supabase/functions/generate-image/index.ts` — reused as-is; client will pass through prompt + style assembled from the spec, and also persist `spec`, `child_given_name`, `authored_by` via a follow-up update to the inserted row (the function already inserts the row keyed by `user_id` + `prompt` + recent `created_at`).

**(d) Style-preset / "Personas" selector**
- `src/hooks/usePersonas.tsx` — data source for the style choices reused on Create
- `src/components/PersonaCard.tsx` — kept; relabelled at the Create call site only

**(e) Shared modules/hooks/types**
- `src/integrations/supabase/client.ts`, `types.ts`
- `src/hooks/useAuth.tsx`

## New module: `src/modules/creation/`

```text
src/modules/creation/
  types.ts                 // JourneyChoice, JourneyStep, JourneyDefinition, CreationSpec
  useCreationJourney.ts    // step index, accumulating spec, reversibility, terminal generate+save
  CreationJourney.tsx      // <CreationJourney definition generate renderPreview onComplete/>
  StepCardGrid.tsx         // 3-4 large tap cards, ≥44px touch targets
  PreviewStack.tsx         // persistent preview pane; one visible layer per choice
  ClaimStep.tsx            // required name + "I made this" claim button
  definitions/
    generalCreate.ts       // 7-step definition shared by Create + Quick Generate
  index.ts
```

### Types (sketch)
- `JourneyChoice { id; label; previewLayer?: { kind: 'color'|'icon'|'image'|'text'; value: string; opacity?: number } }`
- `JourneyStep { id; hostLine: string; choices: JourneyChoice[]; allowChildText?: boolean; optional?: boolean }`
- `JourneyDefinition { id; steps: JourneyStep[] }`
- `CreationSpec { definitionId; choices: Record<stepId, choiceId | string>; freeText?: string; styleId?: string; childGivenName: string }`

### Hook behaviour
- Tracks `stepIndex`, `spec`, `history` (for reversibility before claim).
- `back()` allowed until the claim step.
- `commit(choice)` advances; `setFreeText`, `setStyle`, `setName` for the relevant steps.
- On claim: calls `generate(spec)` exactly once, then writes `spec`, `child_given_name`, `authored_by='child'` to the matching `generated_images` row, then `onComplete(result)`.

### Persistence approach (no schema change)
After `generate-image` resolves with `saved: true`, the client looks up the most recent row for the user matching the assembled prompt and updates `spec`, `child_given_name`, `authored_by`. This keeps the edge function untouched.

## 7-step general definition (Create + Quick Generate)
1. What to create (creature / place / vehicle / object)
2. What it's like (vibe: brave / curious / silly / mysterious)
3. Where it belongs (forest / ocean / space / city)
4. A detail that's yours (color / pattern / accessory / power)
5. Style (optional) — sourced from `usePersonas`, labelled "Styles"
6. Free text (optional) — existing input, demoted to this slot
7. Name & claim (required)

Each choice contributes a `previewLayer` so the preview pane visibly accumulates.

## Touch points in existing files (max 3)

1. **`src/pages/CreativeJourney.tsx`** — replace the current one-shot form with `<CreationJourney definition={generalCreate} generate={invokeGenerateImage} renderPreview={PreviewStack} onComplete={...}/>`. Keep gallery, tour, skeleton, animator dialogs. Rename the styles section label "Personas" → "Styles" here only.
2. **`src/components/dashboard/QuickGenerateWidget.tsx`** — replace input + button with a launcher that opens `<CreationJourney>` in a dialog using the same `generalCreate` definition and the same `generate` adapter; on complete navigate to `/creative-journey` results or close with toast.
3. **Styles rename** — local label change inside the Create surface only (same file as #1). No global rename, no changes to `usePersonas`, `PersonaCard`, or other persona modules.

## Commerce rules
- No credit counters, upsells, or "buy more" anywhere in the journey or claim step.
- On a 402/403 from the generation function, show a neutral message: "This plan has reached its limit. Ask your guardian to review options." with a single action that routes the guardian (not the child) to `/billing`. No bonuses, no countdowns.

## Brand
- Navy `#0A1A3D`, cyan `#5BCEFA`, lavender `#B8A4E3` used via local Tailwind classes within the new module only (no global token edits).

## Out of scope
- No new migration, no edge-function edits, no routing changes, no changes to `usePersonas` data, no replacement of `ImageGallery`/`ImageAnimator`/`ImageEditDialog`.

## Acceptance checklist
- `src/modules/creation/` is standalone and imports nothing Create-specific.
- Create and Quick Generate both mount `<CreationJourney>` with the same definition.
- Flow is tap-first; free text is optional and second-to-last; name+claim required.
- Preview pane gains one visible layer per choice.
- Exactly one `generate-image` call, at claim.
- Every saved row has `spec`, `child_given_name`, `authored_by='child'`.
- "Styles" label appears on Create where "Personas" used to.
- No commerce UI in the flow; limit message routes guardian to billing.
- No new SQL migration.
