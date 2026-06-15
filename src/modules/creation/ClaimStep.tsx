import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ClaimStepProps {
  initialName?: string;
  onClaim: (name: string) => void;
  busy?: boolean;
  disabled?: boolean;
}

export function ClaimStep({ initialName = '', onClaim, busy, disabled }: ClaimStepProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const ready = trimmed.length >= 2 && !disabled && !busy;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block font-display text-sm uppercase tracking-widest text-[#5BCEFA]">
          Name your creation
        </span>
        <input
          type="text"
          value={name}
          maxLength={48}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Starwhisker"
          className={cn(
            'w-full rounded-xl border-2 border-[#5BCEFA]/30 bg-[#0A1A3D]/80',
            'px-4 py-3 text-lg text-white placeholder:text-[#B8A4E3]/50',
            'focus:border-[#5BCEFA] focus:outline-none',
          )}
          style={{ minHeight: 48 }}
        />
      </label>

      <button
        type="button"
        disabled={!ready}
        onClick={() => ready && onClaim(trimmed)}
        className={cn(
          'w-full rounded-2xl px-6 py-4 font-display text-lg uppercase tracking-wider',
          'bg-[#5BCEFA] text-[#0A1A3D] transition-all',
          'hover:brightness-110 active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        style={{ minHeight: 56, touchAction: 'manipulation' }}
      >
        {busy ? 'Bringing it to life...' : 'I made this'}
      </button>
    </div>
  );
}
