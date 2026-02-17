import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sciFiButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-95 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-space-elevated border-2 border-neon-cyan/60 text-neon-cyan shadow-[0_0_15px_hsl(var(--neon-cyan)/0.3)] hover:bg-neon-cyan/20 hover:shadow-[0_0_25px_hsl(var(--neon-cyan)/0.5)] hover:border-neon-cyan",
        primary:
          "bg-gradient-to-r from-primary to-neon-blue border-2 border-primary/60 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:border-primary",
        accent:
          "bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan shadow-[0_0_15px_hsl(var(--neon-cyan)/0.4)] hover:bg-neon-cyan/30 hover:shadow-[0_0_25px_hsl(var(--neon-cyan)/0.6)]",
        ghost:
          "border-2 border-transparent text-foreground hover:border-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/10",
        destructive:
          "bg-destructive/20 border-2 border-destructive/60 text-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.3)] hover:bg-destructive/30 hover:shadow-[0_0_25px_hsl(var(--destructive)/0.5)]",
      },
      size: {
        sm: "h-9 px-4 text-xs min-h-[44px]",
        md: "h-11 px-6 text-sm min-h-[44px]",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
      shape: {
        default: "",
        angled: "",
        rounded: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "default",
    },
  }
);

export interface SciFiButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sciFiButtonVariants> {
  asChild?: boolean;
}

const SciFiButton = React.forwardRef<HTMLButtonElement, SciFiButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      asChild = false,
      children,
      onClick,
      onPointerDown,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // For asChild mode (used with Links/Radix triggers), Slot expects exactly ONE child.
    // Pass children through directly without wrapping in additional spans.
    if (asChild) {
      return (
        <Slot
          className={cn(sciFiButtonVariants({ variant, size, shape, className }))}
          ref={ref}
          onClick={onClick}
          onPointerDown={onPointerDown}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const clipPath =
      shape === "angled"
        ? "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))"
        : undefined;

    // Standard button - use CSS active:scale for immediate visual feedback
    // Let click handle actions to avoid preventDefault() issues with form submissions
    return (
      <Comp
        className={cn(sciFiButtonVariants({ variant, size, shape, className }), "active:scale-[0.98]")}
        ref={ref}
        style={{ clipPath }}
        onClick={onClick}
        onPointerDown={onPointerDown}
        {...props}
      >
        {/* Glow effect overlay - pointer-events-none to allow touch through */}
        <span className="absolute inset-0 opacity-0 transition-opacity duration-300 bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent group-hover:opacity-100 pointer-events-none" />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2 pointer-events-none">{children}</span>
        
        {/* Corner accents */}
        {shape === "angled" && (
          <>
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-60 pointer-events-none" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-60 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-60 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-60 pointer-events-none" />
          </>
        )}
      </Comp>
    );
  }
);
SciFiButton.displayName = "SciFiButton";

export { SciFiButton, sciFiButtonVariants };
