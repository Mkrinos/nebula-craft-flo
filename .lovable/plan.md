

# Restore Missing Source Code

## Problem
The entire `src/` directory is missing from the project. This is why:
- The build fails with error TS18003 ("No inputs found")
- The preview shows an error
- The music button (and everything else) doesn't exist

There are no React components, pages, contexts, hooks, or any application code at all. The project only has configuration files (vite, tailwind, tsconfig, etc.) but no actual source code.

## Plan

### Step 1: Recreate the core application structure
Set up the essential files needed for the app to run:
- `src/main.tsx` - App entry point
- `src/App.tsx` - Root component with routing
- `src/index.css` - Global styles with Tailwind directives

### Step 2: Restore the Lovable Cloud integration files
These are auto-generated but the directory needs to exist:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

### Step 3: Rebuild the music player system
Based on project memories, the app had a rich music player with:
- `MusicContext` / `MusicProvider` for persistent playback across pages
- `MusicPlayer` panel component
- `MiniPlayerBar` with real-time `AudioVisualizer` (bars, wave, circular modes)
- Beat detection and rhythm-based haptics (`useRhythmHaptics`)
- Mobile audio reliability (imperative `audio.src` + `load()` calls)
- 44px touch targets, haptic feedback on controls, 500ms long-press for volume presets

### Step 4: Rebuild the UI shell
Based on the project name "NexusTouch - AI Creative Journey" and dependencies:
- Landing/home page
- Navigation structure
- PWA-ready layout with the theme colors (#0a0a1a)

## Technical Details
- The project uses React 18, Vite, Tailwind CSS, TypeScript, Framer Motion, and shadcn/ui components
- Lovable Cloud is connected (Supabase project `powssiykpmcmkixurodu`)
- PWA is configured with service worker and manifest
- Capacitor is set up for mobile (iOS/Android)

## Important Note
Since all source code is gone, this is essentially rebuilding the application from scratch. The configuration files and project memories give us a blueprint, but the exact original implementation details (all page layouts, component designs, business logic) are lost. I will reconstruct the core structure and the music player system based on available context.

