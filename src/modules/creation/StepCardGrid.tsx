import { cn } from '@/lib/utils';
import type { JourneyChoice } from './types';

interface StepCardGridProps {
  choices: JourneyChoice[];
  onPick: (choice: JourneyChoice) => void;
  disabled?: boolean;
}

export function StepCardGrid({ choices, onPick, disabled }: StepCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-3',
        choices.length <= 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : choices.length === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(choice)}
          className={cn(
            'group relative min-h-[112px] rounded-2xl border-2 p-4 text-left',
            'border-[#5BCEFA]/30 bg-[#0A1A3D]/80 transition-all',
            'hover:border-[#5BCEFA] hover:bg-[#0A1A3D] active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5BCEFA]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          style={{ minHeight: 112, touchAction: 'manipulation' }}
        >
          {choice.emoji && (
            <div className="mb-2 text-3xl" aria-hidden>
              {choice.emoji}
            </div>
          )}
          <div className="font-display text-base text-[#B8A4E3] group-hover:text-white">
            {choice.label}
          </div>
        </button>
      ))}
    </div>
  );
}
