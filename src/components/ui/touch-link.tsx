import { Link, LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Touch-optimized Link component with CSS-based instant visual feedback.
 * Uses standard click events for reliable navigation across all devices.
 */
export interface TouchLinkProps extends Omit<LinkProps, 'onClick'> {
  onClick?: () => void;
  children: React.ReactNode;
}

export function TouchLink({ to, onClick, children, className, ...props }: TouchLinkProps) {
  return (
    <Link
      to={to}
      className={cn("touch-manipulation active:scale-[0.98] active:opacity-80 transition-transform", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
}
