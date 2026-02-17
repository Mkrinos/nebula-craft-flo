import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'purple' | 'cyan' | 'none';
}

const GlassCard = ({ children, className, hover = false, glow = 'none', ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'glass-card p-6',
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:border-primary/50',
        glow === 'purple' && 'neon-glow',
        glow === 'cyan' && 'neon-glow-cyan',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
