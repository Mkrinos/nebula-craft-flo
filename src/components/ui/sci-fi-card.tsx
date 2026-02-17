import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface SciFiCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "elevated" | "hollow" | "gradient";
  headerLabel?: string;
  cornerAccents?: boolean;
  animated?: boolean;
}

const SciFiCard = ({
  children,
  className,
  variant = "default",
  headerLabel,
  cornerAccents = true,
  animated = false,
  ...props
}: SciFiCardProps) => {
  const variantClasses = {
    default: "bg-space-card/90 border-neon-cyan/40",
    elevated: "bg-space-elevated/95 border-neon-cyan/50 shadow-[0_0_30px_hsl(var(--neon-cyan)/0.15)]",
    hollow: "bg-transparent border-neon-cyan/60 backdrop-blur-sm",
    gradient: "bg-gradient-to-br from-space-card/90 to-space-elevated/90 border-primary/50",
  };

  return (
    <div
      className={cn(
        "relative border-2 overflow-hidden transition-all duration-300",
        variantClasses[variant],
        animated && "hover:border-neon-cyan/70 hover:shadow-[0_0_25px_hsl(var(--neon-cyan)/0.25)]",
        className
      )}
      style={{
        clipPath: "polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))"
      }}
      {...props}
    >
      {/* Header label */}
      {headerLabel && (
        <div className="relative flex items-center mb-0">
          {/* Diagonal cut background */}
          <div 
            className="relative flex items-center gap-2 px-4 py-2 bg-space-dark/80 border-b-2 border-neon-cyan/60"
            style={{
              clipPath: "polygon(0 0, 8px 100%, 100% 100%, 100% 0)"
            }}
          >
            {/* Left accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neon-cyan shadow-[0_0_8px_hsl(var(--neon-cyan))]" 
              style={{ clipPath: "polygon(0 0, 100% 8px, 100% 100%, 0 100%)" }}
            />
            
            {/* Decorative dashes before text */}
            <span className="text-neon-cyan/60 font-mono text-sm">┌─</span>
            
            {/* Header text */}
            <span className="text-neon-cyan text-sm font-display uppercase tracking-[0.2em] font-medium drop-shadow-[0_0_6px_hsl(var(--neon-cyan))]">
              {headerLabel}
            </span>
            
            {/* Decorative dashes after text */}
            <span className="text-neon-cyan/60 font-mono text-sm">─┐</span>
          </div>
          
          {/* Extending glow line */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-neon-cyan/60 to-transparent shadow-[0_0_8px_hsl(var(--neon-cyan)/0.5)]" />
        </div>
      )}

      {/* Corner accents */}
      {cornerAccents && (
        <>
          <div className="absolute top-1 left-1 w-5 h-5">
            <div className="absolute top-0 left-2 w-3 h-0.5 bg-neon-cyan/70" />
            <div className="absolute top-2 left-0 w-0.5 h-3 bg-neon-cyan/70" />
          </div>
          <div className="absolute top-1 right-1 w-5 h-5">
            <div className="absolute top-0 right-2 w-3 h-0.5 bg-neon-cyan/70" />
            <div className="absolute top-2 right-0 w-0.5 h-3 bg-neon-cyan/70" />
          </div>
          <div className="absolute bottom-1 left-1 w-5 h-5">
            <div className="absolute bottom-0 left-2 w-3 h-0.5 bg-neon-cyan/70" />
            <div className="absolute bottom-2 left-0 w-0.5 h-3 bg-neon-cyan/70" />
          </div>
          <div className="absolute bottom-1 right-1 w-5 h-5">
            <div className="absolute bottom-0 right-2 w-3 h-0.5 bg-neon-cyan/70" />
            <div className="absolute bottom-2 right-0 w-0.5 h-3 bg-neon-cyan/70" />
          </div>
        </>
      )}

      {/* Inner glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />

      {children}
    </div>
  );
};

interface SciFiCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const SciFiCardHeader = ({ children, className, ...props }: SciFiCardHeaderProps) => (
  <div className={cn("flex items-center gap-3 p-4 border-b border-neon-cyan/20", className)} {...props}>
    {children}
  </div>
);

interface SciFiCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const SciFiCardContent = ({ children, className, ...props }: SciFiCardContentProps) => (
  <div className={cn("p-5", className)} {...props}>
    {children}
  </div>
);

interface SciFiCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const SciFiCardFooter = ({ children, className, ...props }: SciFiCardFooterProps) => (
  <div className={cn("flex items-center gap-3 p-4 border-t border-neon-cyan/20 bg-space-dark/40", className)} {...props}>
    {children}
  </div>
);

export { SciFiCard, SciFiCardHeader, SciFiCardContent, SciFiCardFooter };
