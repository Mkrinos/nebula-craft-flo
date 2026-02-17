import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface SciFiBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const SciFiBadge = ({
  children,
  className,
  variant = "default",
  size = "md",
  pulse = false,
  ...props
}: SciFiBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  const variantClasses = {
    default: "bg-neon-cyan/20 border-neon-cyan/60 text-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)/0.2)]",
    accent: "bg-primary/20 border-primary/60 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]",
    success: "bg-accent/20 border-accent/60 text-accent shadow-[0_0_10px_hsl(var(--accent)/0.2)]",
    warning: "bg-neon-pink/20 border-neon-pink/60 text-neon-pink shadow-[0_0_10px_hsl(var(--neon-pink)/0.2)]",
    destructive: "bg-destructive/20 border-destructive/60 text-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.2)]",
    outline: "bg-transparent border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10",
  };

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center font-display uppercase tracking-widest border transition-all duration-200",
        sizeClasses[size],
        variantClasses[variant],
        pulse && "animate-pulse",
        className
      )}
      style={{
        clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)"
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export { SciFiBadge };
