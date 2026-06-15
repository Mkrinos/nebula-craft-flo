## Goal
Make Guided Creation the sole creation interface on `/creative-journey`. Remove the legacy prompt + style + artwork UI and the spectator-framed banner. Engine, persistence, routing, and shared modules untouched.

## Scope
Single file: `src/pages/CreativeJourney.tsx`.

Do NOT touch:
- `src/modules/creation/*`
- `supabase/functions/generate-image/*`
- `usePersonas`, `PersonaCard`, styles data
- `QuickGenerateWidget` (already wired to the engine)
- Routing, schema, types

## Changes to `src/pages/CreativeJourney.tsx`

1. **Remove legacy creation UI** (lines ~755–1119): the entire `<div className="grid grid-cols-1 lg:grid-cols-3 …">` block, which contains:
   - `IMAGE PROMPT` `SciFiPanel` (textarea, voice input, favorites, language detection, Quick Prompts category chips + list, Random button, PromptEnhancer)
   - `STYLE PRESETS` `SciFiPanel` (style chips + "Save to gallery" checkbox)
   - The standalone `Generate Image` button + "Powered by Lovable AI" line
   - The right-column `Generated Artwork` `SciFiFrame` (artwork preview, animator toggle, download/share/heart, regenerate)

2. **Rewrite the showcase banner copy** (lines ~706–714): keep the video frame, but replace
   - badge: `AI-Powered Creation` → `Your Creative Studio`
   - subtitle: `Watch your imagination come to life with our advanced AI generation tools` → `You direct it, step by step — every choice is yours.`

3. **Remove now-unused state, handlers, imports, and helpers** so the file stays clean and lint-passing:
   - State: `prompt`, `detectedLang`, `selectedStyle`, `generating`, `generatedImage`, `saveToGallery`, `showAnimator`, `promptCategory`, `showCreditsExhausted`
   - Handlers: `handlePromptChange`, `handleVoiceInput`, `handleGenerate`, `handleDownload`, `handleRandomPrompt`
   - Constants: `stylePresets`, `localizedQuickPrompts`, `categoryIcons`, `extendedCategoryLabels`
   - Hooks no longer needed by remaining JSX: `useSubscription` (credits chip stays — see note below), `useFavoritePrompts`, `useQuests` (was only used in `handleGenerate`), `usePersona` (only `styleSuffix`/`awardAffinity` consumed by legacy generate)
   - Imports to drop: `PromptEnhancer`, `ImageAnimator`, `VoiceInputButton`, `ImageGenerationSkeleton`, `SciFiPanel`, `SciFiTextarea`, `SciFiBadge`, `CreditsExhaustedDialog`, `supabase`, `promptPlaceholders`/`getPromptsByCategory`/`categoryLabels`/`categorizedPrompts`/`PromptCategory`, `useGlobalPersona`, `useFavoritePrompts`, `useQuests`, `usePersona`, unused lucide icons (`Wand2`, `Image`, `Settings2`, `Download`, `Share2`, `Heart`, `Maximize2`, `RefreshCw`, `Save`, `Play`, `Globe`, `Trees`, `WandIcon`, `Rocket`, `Shuffle`, `Star`)
   - Keep: `Sparkles`, `Zap`, `FolderOpen`, `LogIn` (still used by header chrome)

4. **Keep intact**:
   - Header (back button, title, credits chip — credits are read-only display, no commerce action inside the journey; the mobile "Get More" button routing to `/billing` is guardian-facing and outside the flow, so it stays as-is)
   - `View Gallery` / `Sign in to Save` button, gallery view branch
   - Showcase video frame, starfield, parallax effects, custom `<style>` keyframes
   - `<CreationJourney …/>` section exactly as currently mounted
   - `CreativeJourneyTour`, `MobileBottomNav`, `PerformanceDashboard`, `PullToRefresh`, `SwipeablePageWrapper`, `SEOHead`

## Acceptance
- `/creative-journey` shows only: header + (rewritten) showcase banner + Guided Creation section + gallery affordance.
- No `Describe your vision` textarea, no Quick Prompts category chips/list, no Random button, no Style Presets panel, no standalone Generate button, no standalone Generated Artwork panel.
- No "Watch your imagination come to life" copy anywhere on the screen.
- `src/modules/creation/`, edge function, schema, and routing are unchanged.
- File compiles with no unused imports/state.
