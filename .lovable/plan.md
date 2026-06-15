## Add loading indicator to preview pane during claim-step generation

Scope: presentation only. Edits limited to `src/modules/creation/PreviewStack.tsx` and `src/modules/creation/CreationJourney.tsx`. No engine, hook, schema, or routing changes.

### Changes

1. **`PreviewStack.tsx`** — add optional `busy?: boolean` prop.
   - When `busy` is true, render an overlay above all layers (z-index ~60, below the name caption or above it — above, so the indicator is unmistakable):
     - Soft dark scrim (`bg-[#0A1A3D]/55`, backdrop blur).
     - Centered column with:
       - A slow-spinning ring (3s linear) in `#5BCEFA` using a Tailwind `animate-spin` style with custom duration via inline `animationDuration: '3s'` (honors the project's slow-pacing rule).
       - A gently pulsing label "Bringing {childGivenName || 'your creation'} to life…" in `#B8A4E3`, font-display, with `animate-pulse` and inline `animationDuration: '4s'` (matches the 4s pulse rule from memory).
     - `role="status"` and `aria-live="polite"` for accessibility.
   - No `e.preventDefault()` or touch-blocking; overlay uses `pointer-events-none` so existing layers stay inert visually only.

2. **`CreationJourney.tsx`** — pass `busy` into the preview:
   - Update the two preview branches: `renderPreview ? renderPreview(j.spec) : <PreviewStack spec={j.spec} busy={j.busy} />`.
   - For the `renderPreview` custom case, leave behavior to the caller (no signature change needed beyond what already exists; `j.busy` is internal). No callers currently pass `renderPreview`, so this is sufficient.

### Acceptance

- During claim-step generation, the right-hand preview pane shows a visible spinner + "Bringing … to life…" caption over the accumulated choice layers.
- Indicator disappears as soon as `j.busy` flips false (success, error, or limit-reached).
- Animations respect the slow-pacing rule (3s spin, 4s pulse).
- No changes to prompt assembly, generation timing, persistence, or routing.