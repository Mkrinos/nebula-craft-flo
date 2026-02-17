import * as React from "react";
import { cn } from "@/lib/utils";

interface SciFiProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "accent" | "gradient" | "segmented";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  label?: string;
  animated?: boolean;
}

const SciFiProgress = React.forwardRef<HTMLDivElement, SciFiProgressProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    variant = "default", 
    size = "md",
    showValue = false,
    label,
    animated = true,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-2",
      md: "h-4",
      lg: "h-6",
    };

    const variantClasses = {
      default: "bg-neon-cyan",
      accent: "bg-primary",
      gradient: "bg-gradient-to-r from-neon-cyan via-primary to-neon-pink",
      segmented: "bg-neon-cyan",
    };

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {/* Label and value */}
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <span className="text-xs font-display uppercase tracking-widest text-neon-cyan/80">
                {label}
              </span>
            )}
            {showValue && (
              <span className="text-xs font-display text-neon-cyan">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        {/* Progress bar container */}
        <div 
          className={cn(
            "relative w-full bg-space-dark border-2 border-neon-cyan/40 overflow-hidden",
            sizeClasses[size]
          )}
          style={{
            clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))"
          }}
        >
          {/* Fill */}
          {variant === "segmented" ? (
            <div className="absolute inset-0 flex gap-1 p-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 transition-all duration-300",
                    i < Math.ceil(percentage / 10)
                      ? "bg-neon-cyan shadow-[0_0_8px_hsl(var(--neon-cyan)/0.6)]"
                      : "bg-neon-cyan/20"
                  )}
                  style={{
                    clipPath: "polygon(15% 0, 100% 0, 85% 100%, 0 100%)"
                  }}
                />
              ))}
            </div>
          ) : (
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                variantClasses[variant],
                animated && "relative overflow-hidden"
              )}
              style={{ width: `${percentage}%` }}
            >
              {/* Animated shine effect */}
              {animated && (
                <div className="absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              )}
              
              {/* Glow effect */}
              <div className="absolute inset-0 shadow-[0_0_10px_hsl(var(--neon-cyan)/0.5)]" />
            </div>
          )}

          {/* Scanlines overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,hsl(var(--neon-cyan)/0.5)_1px,hsl(var(--neon-cyan)/0.5)_2px)]" />
        </div>

        {/* End decorations */}
        <div className="flex justify-between mt-1">
          <div className="w-1 h-1 bg-neon-cyan/60" />
          <div className="w-1 h-1 bg-neon-cyan/60" />
        </div>
      </div>
    );
  }
);
SciFiProgress.displayName = "SciFiProgress";

export { SciFiProgress };
