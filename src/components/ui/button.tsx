import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-sans tracking-wide touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-gradient-to-r from-primary to-neon-blue text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105",
        "neon-outline": "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 shadow-lg shadow-primary/20",
        "neon-cyan": "bg-gradient-to-r from-accent to-neon-blue text-accent-foreground shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105",
        glass: "glass-card border-border/50 text-foreground hover:border-primary/50 hover:bg-secondary/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, onPointerDown, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // For asChild mode (used with Radix triggers), don't intercept events
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }), "active:scale-[0.98]")}
          ref={ref}
          onClick={onClick}
          onPointerDown={onPointerDown}
          {...props}
        />
      );
    }

    // Standard button - use CSS for immediate visual feedback, let click handle action
    // This avoids issues with preventDefault() breaking form submissions and event propagation
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "active:scale-[0.98]")}
        ref={ref}
        onClick={onClick}
        onPointerDown={onPointerDown}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
