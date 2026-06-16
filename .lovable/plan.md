# Pass 1 (Fix) — Stop the refresh + surface the real generation error

Scope is limited to `src/modules/creation/` and the `generate-image` edge function. No schema change.

## Report: why "Edge Function returned a non-2xx status code" surfaces

- **Function is deployed.** `supabase/config.toml` declares `[functions.generate-image] verify_jwt = false`. Recent edge logs show only `shutdown` events (no recorded 4xx/5xx bodies for the current invocation window), which means the previous failures were transport-level/non-2xx responses returned synchronously — exactly the case `supabase.functions.invoke` collapses into the generic message *"Edge Function returned a non-2xx status code"*.
- **Required secrets are present.** `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_URL`, `RESEND_API_KEY` are all set. So the function will reach the AI gateway.
- **Most recent known concrete cause** (already partially addressed): `validatePrompt` was throwing `Prompt is too long. Maximum 500 characters allowed.` because `composePrompt` produces ~1.5k chars. `MAX_PROMPT_LENGTH` was raised to 4000 in the last turn. Any prompt that still trips validation (e.g. very long free text) will return a 400 with `{ error: "..." }` — that JSON body is being thrown away by the client today (see next point).
- **Real root cause of the unhelpful UI message.** In `generateAdapter.ts`, when `supabase.functions.invoke` returns a non-2xx, `error.message` is the generic string and the actual JSON `{ error }` body is on `error.context` (a `Response`). The adapter never reads it, so the reveal never shows the real reason (`"Prompt is too long..."`, `"Not enough credits"`, `"Service temporarily unavailable"`, etc.).

## A. Stop the page from "refreshing" on "I MADE THIS"

The `ClaimStep` button is already `type="button"` and not inside a `<form>`, so there is no native form submission. The perceived "refresh" is one of:

1. The CreativeJourney page wraps everything in `<PullToRefresh>`. On a touch-then-release where the finger drifts even a few px, the pull-to-refresh handler can fire `onRefresh`, which re-renders the page tree. State inside `useCreationJourney` survives, but the user reads the toast + re-render as a "refresh".
2. A second tap can re-enter `fireGenerate` before `busy` flips, racing two generations.

Fixes inside `src/modules/creation/`:

- **`ClaimStep.tsx`** — keep `type="button"`; change the button's `onClick` to `(e) => { e.preventDefault(); e.stopPropagation(); if (ready) onClaim(trimmed); }`. Add `onPointerDown={(e) => e.stopPropagation()}` and `onTouchStart={(e) => e.stopPropagation()}` so the pull-to-refresh / swipe-back wrappers cannot interpret the press as a gesture.
- **Disable while generating.** `ClaimStep` already disables on `busy`, but the parent passes `busy={j.busy}` only — we also pass `disabled` when `j.result` exists so a stale tap after success/error is a no-op. Keep `ready` gate.
- **`CreationJourney.tsx`** — wrap the claim-step branch's `onClaim` handler the same way and remove the `setTimeout(() => j.fireGenerate(), 0)` race: call `j.setName(name)` and then `j.fireGenerate(name)` directly (see hook change below) so the name is read from the argument, not from React state that has not yet committed. `fireGenerate` already guards on `busy || result`.
- **`useCreationJourney.ts`** — change `fireGenerate` to accept an optional `nameOverride: string` and prefer it over `spec.childGivenName` when validating, so the imperative call doesn't depend on a re-render landing first. `setName(name)` is still called for downstream persistence.

## B. Surface the real edge-function error + never crash/reload

- **`generateAdapter.ts`** — when `supabase.functions.invoke` returns `error`, try to read the JSON body from `error.context` (it's a `Response`) before falling back to `error.message`:
  ```ts
  let detail = error.message;
  try {
    if ((error as any).context && typeof (error as any).context.json === 'function') {
      const body = await (error as any).context.json();
      if (body?.error) detail = body.error;
    }
  } catch { /* ignore parse errors, keep generic message */ }
  const limitReached = /limit|credit|quota|402|403/i.test(detail);
  return { image: '', error: detail, limitReached, authorshipSummary };
  ```
  Also widen the limit detection regex to include `"upgrade"` and `"plan"`.
- **`useCreationJourney.ts`** — `fireGenerate` already wraps in `try/catch/finally`, sets `busy=false`, and stores `{ image: '', error }` so the reveal's failure branch renders. Confirm: no `throw` escapes, `setBusy(false)` always runs. No change needed beyond the `nameOverride` above.
- **`CreationJourney.tsx`** reveal — the failure branch (`hasFailure`) already shows the message + Retry + Start over and is gated on `j.result && !j.result.image && !limitReached`. With the adapter change, `j.error` will be the real backend message (e.g. *"Prompt is too long. Maximum 4000 characters allowed."*).

No edge-function code change is required for this pass; `MAX_PROMPT_LENGTH=4000` already landed. If logs later show a different concrete failure (e.g. gateway 429), it will now be visible in the reveal and we can act on it.

## Files touched

- `src/modules/creation/ClaimStep.tsx` — preventDefault/stopPropagation on press, pointer/touch stopPropagation, accept `disabled` from parent.
- `src/modules/creation/CreationJourney.tsx` — call `j.fireGenerate(name)` directly (drop `setTimeout`), pass `disabled` when a result exists.
- `src/modules/creation/useCreationJourney.ts` — `fireGenerate(nameOverride?: string)` uses the override for the empty-name guard and for persistence.
- `src/modules/creation/generateAdapter.ts` — read JSON body from the failed-response `error.context` and forward the real message; widen limit-reached regex.

## Acceptance

- Tapping "I MADE THIS" never reloads the page and never re-fires while `busy`.
- The claim press does not trigger pull-to-refresh / swipe-back on the parent.
- A successful generation shows the large in-flow reveal (named, with authorship) and saves to the gallery.
- A failed generation shows the failure reveal with the **real** backend message + Retry / Start over; no crash, no reload.
- The edge function returns 2xx for a valid request (already deployed, secrets present, prompt cap raised).
