import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface SciFiDividerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "accent" | "decorated";
  orientation?: "horizontal" | "vertical";
}

const SciFiDivider = ({
  className,
  variant = "default",
  orientation = "horizontal",
  ...props
}: SciFiDividerProps) => {
  if (orientation === "vertical") {
    return (
      <div
        className={cn(
          "relative w-px min-h-[40px]",
          variant === "default" && "bg-gradient-to-b from-transparent via-neon-cyan/50 to-transparent",
          variant === "accent" && "bg-gradient-to-b from-transparent via-primary/50 to-transparent",
          className
        )}
        {...props}
      />
    );
  }

  if (variant === "decorated") {
    return (
      <div className={cn("relative flex items-center gap-4 py-4", className)} {...props}>
        {/* Left line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-neon-cyan/60" />
        
        {/* Center decoration */}
        <div className="relative flex items-center gap-2">
          <div className="w-2 h-2 rotate-45 border border-neon-cyan/60 bg-neon-cyan/20" />
          <div className="w-3 h-3 rotate-45 border-2 border-neon-cyan bg-space-dark shadow-[0_0_10px_hsl(var(--neon-cyan)/0.5)]" />
          <div className="w-2 h-2 rotate-45 border border-neon-cyan/60 bg-neon-cyan/20" />
        </div>
        
        {/* Right line */}
        <div className="flex-1 h-px bg-gradient-to-r from-neon-cyan/60 via-neon-cyan/30 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-px w-full my-4",
        variant === "default" && "bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent",
        variant === "accent" && "bg-gradient-to-r from-transparent via-primary/50 to-transparent",
        className
      )}
      {...props}
    >
      {/* End caps */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l border-t border-neon-cyan/40 -rotate-45" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-r border-b border-neon-cyan/40 -rotate-45" />
    </div>
  );
};

export { SciFiDivider };
