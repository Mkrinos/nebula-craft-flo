import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface SciFiPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  variant?: "default" | "inset" | "floating";
  status?: "default" | "active" | "warning" | "error";
}

const SciFiPanel = ({
  children,
  className,
  title,
  subtitle,
  headerRight,
  variant = "default",
  status = "default",
  ...props
}: SciFiPanelProps) => {
  const variantClasses = {
    default: "bg-space-card/95",
    inset: "bg-space-dark/95 shadow-inner",
    floating: "bg-space-elevated/95 shadow-[0_10px_40px_-10px_hsl(var(--neon-cyan)/0.2)]",
  };

  const statusBorderClasses = {
    default: "border-neon-cyan/40",
    active: "border-neon-cyan shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)]",
    warning: "border-neon-pink/60 shadow-[0_0_20px_hsl(var(--neon-pink)/0.2)]",
    error: "border-destructive/60 shadow-[0_0_20px_hsl(var(--destructive)/0.2)]",
  };

  const statusIndicatorClasses = {
    default: "bg-neon-cyan/50",
    active: "bg-neon-cyan animate-pulse",
    warning: "bg-neon-pink animate-pulse",
    error: "bg-destructive animate-pulse",
  };

  return (
    <div
      className={cn(
        "relative border-2 overflow-hidden backdrop-blur-sm",
        variantClasses[variant],
        statusBorderClasses[status],
        className
      )}
      style={{
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
      }}
      {...props}
    >
      {/* Top-right corner cut decoration */}
      <div className="absolute top-0 right-0 w-[20px] h-[20px]">
        <div className="absolute top-0 right-[20px] w-px h-full bg-neon-cyan/50" style={{ transform: 'rotate(45deg)', transformOrigin: 'top right' }} />
      </div>

      {/* Bottom-left corner cut decoration */}
      <div className="absolute bottom-0 left-0 w-[20px] h-[20px]">
        <div className="absolute bottom-0 left-[20px] w-px h-full bg-neon-cyan/50" style={{ transform: 'rotate(45deg)', transformOrigin: 'bottom left' }} />
      </div>

      {/* Header */}
      {(title || headerRight) && (
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-neon-cyan/20 bg-space-dark/40">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={cn("w-2 h-2 rounded-full", statusIndicatorClasses[status])} />
            
            <div>
              {title && (
                <h3 className="font-display text-sm uppercase tracking-widest text-foreground">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          {headerRight && (
            <div className="flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {children}
      </div>

      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-neon-cyan/70 to-transparent" />
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-neon-cyan/70 to-transparent" />
      </div>
    </div>
  );
};

export { SciFiPanel };
