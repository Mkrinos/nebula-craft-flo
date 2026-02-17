import { cn } from '@/lib/utils';

interface NexusLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const NexusLogo = ({ className, showText = true, size = 'md' }: NexusLogoProps) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-14 h-14', text: 'text-3xl' },
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('relative', sizes[size].icon)} style={{ willChange: 'transform' }}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary animate-spin-slow" style={{ willChange: 'transform' }} />
        {/* Inner glow */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary to-accent opacity-80" />
        {/* Center dot */}
        <div className="absolute inset-3 rounded-full bg-background" />
        <div className="absolute inset-[14px] rounded-full bg-primary animate-pulse" style={{ willChange: 'opacity' }} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-display font-bold text-gradient tracking-wider', sizes[size].text)}>
            NEXUS
          </span>
          <span className="text-xs text-accent font-medium tracking-[0.2em]">
            TOUCH
          </span>
        </div>
      )}
    </div>
  );
};

export default NexusLogo;
