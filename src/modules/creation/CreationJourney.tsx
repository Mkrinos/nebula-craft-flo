import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCreationJourney, type GenerateFn } from './useCreationJourney';
import { PreviewStack } from './PreviewStack';
import { StepCardGrid } from './StepCardGrid';
import { ClaimStep } from './ClaimStep';
import type { CreationSpec, GenerateResult, JourneyDefinition } from './types';

interface CreationJourneyProps {
  definition: JourneyDefinition;
  generate: GenerateFn;
  onComplete?: (result: GenerateResult, spec: CreationSpec) => void;
  onViewGallery?: () => void;
  renderPreview?: (spec: CreationSpec) => React.ReactNode;
}

const STYLE_OPTIONS = [
  { id: 'anime', label: 'Anime', emoji: '🌸' },
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨' },
  { id: 'watercolor', label: 'Watercolor', emoji: '💧' },
  { id: 'pixel-art', label: 'Pixel Art', emoji: '👾' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: 'sci-fi', label: 'Sci-Fi', emoji: '🚀' },
];

export function CreationJourney({
  definition,
  generate,
  onComplete,
  onViewGallery,
  renderPreview,
}: CreationJourneyProps) {
  const navigate = useNavigate();
  const j = useCreationJourney({ definition, generate, onComplete });
  const step = j.currentStep;
  const revealHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const limitReached = j.result?.limitReached;
  const hasSuccess = !!(j.result && j.result.image && !j.result.error);
  const hasFailure = !!(j.result && !j.result.image && !limitReached);

  useEffect(() => {
    if (hasSuccess && revealHeadingRef.current) {
      revealHeadingRef.current.focus();
    }
  }, [hasSuccess]);

  if (!step) return null;

  // ============================================================
  // REVEAL STAGE — takes over the layout once generation finishes
  // ============================================================
  if (j.result) {
    return (
      <div className="mx-auto w-full max-w-2xl animate-in fade-in duration-500">
        {/* SUCCESS */}
        {hasSuccess && (
          <section
            role="region"
            aria-label="Your creation"
            className="flex flex-col items-center gap-5 text-center"
          >
            <h2
              ref={revealHeadingRef}
              tabIndex={-1}
              className="font-display text-4xl text-white outline-none sm:text-5xl"
            >
              {j.spec.childGivenName || 'Your creation'}
            </h2>

            <div className="w-full overflow-hidden rounded-3xl border-2 border-[#5BCEFA]/40 bg-[#0A1A3D] shadow-[0_0_60px_rgba(91,206,250,0.25)]">
              <img
                src={j.result!.image}
                alt={j.spec.childGivenName || 'Your creation'}
                className="aspect-square w-full object-contain"
              />
            </div>

            <p className="max-w-xl text-base text-[#B8A4E3] sm:text-lg">
              {j.result!.authorshipSummary || 'You made this.'}
            </p>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  if (onViewGallery) onViewGallery();
                  else navigate('/creative-journey');
                }}
                className={cn(
                  'rounded-xl bg-[#5BCEFA] px-6 py-3 font-display text-[#0A1A3D]',
                  'hover:brightness-110 active:scale-[0.98]',
                )}
                style={{ minHeight: 48, touchAction: 'manipulation' }}
              >
                View in Gallery
              </button>
              <button
                type="button"
                onClick={j.reset}
                className={cn(
                  'rounded-xl border-2 border-[#5BCEFA]/40 px-6 py-3 font-display text-[#B8A4E3]',
                  'hover:border-[#5BCEFA] hover:text-white active:scale-[0.98]',
                )}
                style={{ minHeight: 48, touchAction: 'manipulation' }}
              >
                Make another
              </button>
            </div>
          </section>
        )}

        {/* FAILURE (non-limit) */}
        {hasFailure && (
          <section
            role="alert"
            className="space-y-4 rounded-2xl border border-[#B8A4E3]/40 bg-[#0A1A3D]/80 p-6 text-center"
          >
            <h2 className="font-display text-2xl text-white sm:text-3xl">
              That didn't come through
            </h2>
            <p className="text-[#B8A4E3]">
              {j.error || "Something interrupted the spark. Let's try again."}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={j.retryGenerate}
                disabled={j.busy}
                className={cn(
                  'rounded-xl bg-[#5BCEFA] px-6 py-3 font-display text-[#0A1A3D]',
                  'hover:brightness-110 active:scale-[0.98] disabled:opacity-50',
                )}
                style={{ minHeight: 48, touchAction: 'manipulation' }}
              >
                {j.busy ? 'Trying again…' : 'Retry'}
              </button>
              <button
                type="button"
                onClick={j.reset}
                className="rounded-xl border-2 border-[#5BCEFA]/40 px-6 py-3 font-display text-[#B8A4E3] hover:border-[#5BCEFA] hover:text-white"
                style={{ minHeight: 48, touchAction: 'manipulation' }}
              >
                Start over
              </button>
            </div>
          </section>
        )}

        {/* LIMIT REACHED */}
        {limitReached && (
          <section className="space-y-4 rounded-2xl border border-[#B8A4E3]/40 bg-[#0A1A3D]/80 p-6 text-center">
            <h2 className="font-display text-2xl text-white">
              This plan has reached its limit
            </h2>
            <p className="text-[#B8A4E3]">
              Ask your guardian to review options when you're ready.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="rounded-xl bg-[#5BCEFA] px-6 py-3 font-display text-[#0A1A3D] hover:brightness-110"
                style={{ minHeight: 48, touchAction: 'manipulation' }}
              >
                Guardian: review plan
              </button>
              <button
                type="button"
                onClick={j.reset}
                className="rounded-xl border-2 border-[#5BCEFA]/40 px-6 py-3 font-display text-[#B8A4E3] hover:border-[#5BCEFA] hover:text-white"
                style={{ minHeight: 48, touchAction: 'manipulation' }}
              >
                Start over
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
      {/* LEFT: step content */}
      <div className="space-y-5">
        {/* Progress + back */}
        <div className="flex items-center justify-between">
          <div className="font-display text-xs uppercase tracking-widest text-[#B8A4E3]">
            Step {j.progress.current} of {j.progress.total}
          </div>
          {j.canGoBack && (
            <button
              type="button"
              onClick={j.goBack}
              className="rounded-lg px-3 py-2 text-sm text-[#5BCEFA] hover:bg-[#5BCEFA]/10"
              style={{ minHeight: 44 }}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Host line */}
        <h2 className="font-display text-2xl text-white sm:text-3xl">
          {step.hostLine}
        </h2>

        {/* Body by step kind */}
        {!j.result && step.kind !== 'claim' && step.kind !== 'freeText' && step.kind !== 'style' && step.choices && (
          <StepCardGrid choices={step.choices} onPick={j.commitChoice} disabled={j.busy} />
        )}

        {!j.result && step.kind === 'style' && (
          <div className="space-y-3">
            <StepCardGrid
              choices={STYLE_OPTIONS.map((s) => ({
                id: s.id,
                label: s.label,
                emoji: s.emoji,
                promptFragment: `${s.label.toLowerCase()} style`,
                previewLayer: { kind: 'text', value: s.emoji, label: s.label },
              }))}
              onPick={(c) => {
                j.setStyle(c.id);
                j.commitChoice(c);
              }}
              disabled={j.busy}
            />
            {step.optional && (
              <button
                type="button"
                onClick={j.skipStep}
                className="text-sm text-[#B8A4E3] hover:text-white"
                style={{ minHeight: 44 }}
              >
                Skip — no style
              </button>
            )}
          </div>
        )}

        {!j.result && step.kind === 'freeText' && (
          <div className="space-y-3">
            <textarea
              value={j.spec.freeText ?? ''}
              onChange={(e) => j.setFreeText(e.target.value)}
              placeholder={step.placeholder ?? 'Add anything extra (optional)…'}
              maxLength={300}
              rows={4}
              className={cn(
                'w-full rounded-xl border-2 border-[#5BCEFA]/30 bg-[#0A1A3D]/80',
                'px-4 py-3 text-base text-white placeholder:text-[#B8A4E3]/50',
                'focus:border-[#5BCEFA] focus:outline-none',
              )}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // commit a no-op layer-less choice to advance
                  j.commitChoice({ id: 'freeText', label: j.spec.freeText || '', promptFragment: j.spec.freeText });
                }}
                className={cn(
                  'flex-1 rounded-xl bg-[#5BCEFA] px-5 py-3 font-display text-[#0A1A3D]',
                  'hover:brightness-110 active:scale-[0.98]',
                )}
                style={{ minHeight: 48 }}
              >
                Continue
              </button>
              {step.optional && (
                <button
                  type="button"
                  onClick={j.skipStep}
                  className="rounded-xl border-2 border-[#5BCEFA]/30 px-5 py-3 text-[#B8A4E3] hover:border-[#5BCEFA]"
                  style={{ minHeight: 48 }}
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}

        {!j.result && step.kind === 'claim' && (
          <ClaimStep
            initialName={j.spec.childGivenName}
            busy={j.busy}
            disabled={!!j.result}
            onClaim={(name) => {
              j.setName(name);
              // Pass the name directly to avoid a setState race
              void j.fireGenerate(name);
            }}
          />
        )}

        {j.error && !j.result && (
          <div className="rounded-xl border border-[#B8A4E3]/40 bg-[#0A1A3D]/80 p-4 text-sm text-[#B8A4E3]">
            {j.error}
          </div>
        )}
      </div>

      {/* RIGHT: persistent preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        {renderPreview ? renderPreview(j.spec) : <PreviewStack spec={j.spec} busy={j.busy} />}
      </div>
    </div>
  );
}
