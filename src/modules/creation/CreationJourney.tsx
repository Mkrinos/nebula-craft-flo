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
  renderPreview,
}: CreationJourneyProps) {
  const navigate = useNavigate();
  const j = useCreationJourney({ definition, generate, onComplete });
  const step = j.currentStep;

  if (!step) return null;

  const limitReached = j.result?.limitReached;

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
            onClaim={(name) => {
              j.setName(name);
              // Defer one tick so state lands before generating
              setTimeout(() => j.fireGenerate(), 0);
            }}
          />
        )}

        {j.error && !limitReached && (
          <div className="rounded-xl border border-[#B8A4E3]/40 bg-[#0A1A3D]/80 p-4 text-sm text-[#B8A4E3]">
            {j.error}
          </div>
        )}

        {limitReached && (
          <div className="space-y-3 rounded-xl border border-[#B8A4E3]/40 bg-[#0A1A3D]/80 p-4 text-sm text-[#B8A4E3]">
            <p>
              This plan has reached its limit for now. Ask your guardian to review options.
            </p>
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="rounded-lg bg-[#5BCEFA] px-4 py-2 text-[#0A1A3D]"
              style={{ minHeight: 44 }}
            >
              Guardian: review plan
            </button>
          </div>
        )}

        {j.result && j.result.image && !j.error && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[#5BCEFA]/40">
              <img src={j.result.image} alt={j.spec.childGivenName} className="w-full" />
            </div>
            {j.result.authorshipSummary && (
              <p className="text-sm text-[#B8A4E3]">{j.result.authorshipSummary}</p>
            )}
            <button
              type="button"
              onClick={j.reset}
              className="w-full rounded-xl border-2 border-[#5BCEFA]/30 px-5 py-3 text-[#B8A4E3] hover:border-[#5BCEFA]"
              style={{ minHeight: 48 }}
            >
              Make another
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: persistent preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        {renderPreview ? renderPreview(j.spec) : <PreviewStack spec={j.spec} />}
      </div>
    </div>
  );
}
