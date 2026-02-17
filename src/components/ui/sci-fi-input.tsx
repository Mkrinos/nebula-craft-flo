import * as React from "react";
import { cn } from "@/lib/utils";

export interface SciFiInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const SciFiInput = React.forwardRef<HTMLInputElement, SciFiInputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label className="block mb-2 text-xs font-display uppercase tracking-widest text-neon-cyan/80">
            {label}
          </label>
        )}
        <div className="relative group">
          {/* Input field */}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full bg-space-dark/80 border-2 border-neon-cyan/40 px-4 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground transition-all duration-300",
              "focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3),inset_0_0_10px_hsl(var(--neon-cyan)/0.1)]",
              "hover:border-neon-cyan/60",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-11",
              error && "border-destructive/60 focus:border-destructive focus:shadow-[0_0_20px_hsl(var(--destructive)/0.3)]",
              className
            )}
            style={{
              clipPath: "polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))"
            }}
            ref={ref}
            {...props}
          />
          
          {/* Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan/60 group-focus-within:text-neon-cyan transition-colors">
              {icon}
            </div>
          )}
          
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-cyan/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-cyan/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan/50 pointer-events-none" />
        </div>
        
        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-xs text-destructive font-sans">{error}</p>
        )}
      </div>
    );
  }
);
SciFiInput.displayName = "SciFiInput";

export interface SciFiTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const SciFiTextarea = React.forwardRef<HTMLTextAreaElement, SciFiTextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label className="block mb-2 text-xs font-display uppercase tracking-widest text-neon-cyan/80">
            {label}
          </label>
        )}
        <div className="relative group">
          <textarea
            className={cn(
              "flex min-h-[120px] w-full bg-space-dark/80 border-2 border-neon-cyan/40 px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground transition-all duration-300 resize-none",
              "focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3),inset_0_0_10px_hsl(var(--neon-cyan)/0.1)]",
              "hover:border-neon-cyan/60",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive/60 focus:border-destructive",
              className
            )}
            style={{
              clipPath: "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))"
            }}
            ref={ref}
            {...props}
          />
          
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-cyan/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-cyan/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan/50 pointer-events-none" />
        </div>
        
        {error && (
          <p className="mt-1.5 text-xs text-destructive font-sans">{error}</p>
        )}
      </div>
    );
  }
);
SciFiTextarea.displayName = "SciFiTextarea";

export { SciFiInput, SciFiTextarea };
