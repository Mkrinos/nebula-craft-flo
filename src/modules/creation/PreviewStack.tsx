import { cn } from '@/lib/utils';
import type { CreationSpec } from './types';

interface PreviewStackProps {
  spec: CreationSpec;
  className?: string;
}

/**
 * Persistent preview pane. Each committed choice contributes one visible
 * layer that stacks on top of the previous ones, so the child sees their
 * creation accumulating before generation runs.
 */
export function PreviewStack({ spec, className }: PreviewStackProps) {
  return (
    <div
      className={cn(
        'relative aspect-square w-full overflow-hidden rounded-2xl border',
        'border-[#5BCEFA]/30 bg-[#0A1A3D]',
        className,
      )}
      style={{ contain: 'paint' }}
    >
      {/* Base ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(91,206,250,0.22), transparent 60%), radial-gradient(circle at 30% 30%, rgba(184,164,227,0.18), transparent 65%)',
        }}
      />

      {spec.layers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="px-6 text-center text-sm text-[#B8A4E3]/80">
            Your creation will appear here as you make choices.
          </p>
        </div>
      )}

      {spec.layers.map((layer, i) => {
        const z = 10 + i;
        const offset = (i + 1) * 6;
        const opacity = layer.opacity ?? Math.min(1, 0.55 + i * 0.08);

        if (layer.kind === 'color') {
          return (
            <div
              key={i}
              className="absolute rounded-full blur-2xl"
              style={{
                background: layer.value,
                opacity,
                zIndex: z,
                left: `${10 + offset}%`,
                top: `${15 + offset}%`,
                width: `${55 - i * 4}%`,
                height: `${55 - i * 4}%`,
                mixBlendMode: 'screen',
              }}
              aria-label={layer.label}
            />
          );
        }
        if (layer.kind === 'icon' || layer.kind === 'text') {
          return (
            <div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                opacity,
                zIndex: z,
                left: `${8 + offset * 1.2}%`,
                top: `${20 + offset * 1.1}%`,
                fontSize: `${72 - i * 6}px`,
                lineHeight: 1,
                filter: 'drop-shadow(0 4px 18px rgba(91,206,250,0.45))',
              }}
              aria-label={layer.label}
            >
              <span className="text-[#B8A4E3]">{layer.value}</span>
            </div>
          );
        }
        if (layer.kind === 'image') {
          return (
            <img
              key={i}
              src={layer.value}
              alt={layer.label ?? ''}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity, zIndex: z, mixBlendMode: 'screen' }}
            />
          );
        }
        return null;
      })}

      {/* Name overlay when claim has been set */}
      {spec.childGivenName && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-[#0A1A3D] to-transparent p-4 text-center"
        >
          <p className="font-display text-lg text-[#5BCEFA]">
            {spec.childGivenName}
          </p>
        </div>
      )}
    </div>
  );
}
