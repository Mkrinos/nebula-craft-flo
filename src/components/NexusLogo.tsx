import { cn } from '@/lib/utils';
import nexusLogoVideo from '@/assets/nexus-logo-animation.mp4';

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
      <div className={cn('relative overflow-hidden rounded-full', sizes[size].icon)}>
        <video
          src={nexusLogoVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ mixBlendMode: 'screen' }}
        />
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
