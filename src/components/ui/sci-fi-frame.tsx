import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface SciFiFrameProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "accent" | "warning" | "success";
  size?: "sm" | "md" | "lg";
  cornerStyle?: "angled" | "rounded" | "mixed";
  glowIntensity?: "none" | "subtle" | "medium" | "strong";
  animated?: boolean;
}

const SciFiFrame = ({
  children,
  className,
  variant = "default",
  size = "md",
  cornerStyle = "angled",
  glowIntensity = "subtle",
  animated = false,
  ...props
}: SciFiFrameProps) => {
  const sizeClasses = {
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  const variantClasses = {
    default: "border-neon-cyan/60 before:bg-neon-cyan/10",
    accent: "border-primary/60 before:bg-primary/10",
    warning: "border-neon-pink/60 before:bg-neon-pink/10",
    success: "border-accent/60 before:bg-accent/10",
  };

  const glowClasses = {
    none: "",
    subtle: "shadow-[0_0_15px_hsl(var(--neon-cyan)/0.2)]",
    medium: "shadow-[0_0_25px_hsl(var(--neon-cyan)/0.35),inset_0_0_15px_hsl(var(--neon-cyan)/0.1)]",
    strong: "shadow-[0_0_40px_hsl(var(--neon-cyan)/0.5),inset_0_0_25px_hsl(var(--neon-cyan)/0.15)]",
  };

  const cornerClasses = {
    angled: "clip-path-frame",
    rounded: "rounded-xl",
    mixed: "rounded-tl-xl rounded-br-xl clip-path-frame-mixed",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 bg-space-dark/80 backdrop-blur-md transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        glowClasses[glowIntensity],
        cornerStyle === "rounded" && "rounded-xl",
        animated && "hover:shadow-[0_0_35px_hsl(var(--neon-cyan)/0.4)] hover:border-neon-cyan/80",
        className
      )}
      style={{
        clipPath: cornerStyle === "angled" 
          ? "polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))"
          : cornerStyle === "mixed"
          ? "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))"
          : undefined
      }}
      {...props}
    >
      {/* Corner decorations - pointer-events-none to not block button clicks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan/80 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan/80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan/80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan/80 pointer-events-none" />
      
      {/* Scanline effect */}
      {animated && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(var(--neon-cyan)/0.5)_2px,hsl(var(--neon-cyan)/0.5)_4px)]" />
      )}
      
      {children}
    </div>
  );
};

export { SciFiFrame };
