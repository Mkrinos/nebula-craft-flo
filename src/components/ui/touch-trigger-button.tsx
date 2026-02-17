import * as React from "react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/hooks/useHapticFeedback";

/**
 * Touch-friendly trigger button for Radix `asChild` triggers.
 *
 * Unlike our main Button/SciFiButton components, this does NOT call
 * `preventDefault()` on touch pointer down. That keeps Radix triggers
 * (DropdownMenu/Popover/Sheet) reliable on mobile/tablet.
 * 
 * Includes haptic feedback on touch for tactile response.
 */
export interface TouchTriggerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  style?: React.CSSProperties;
  /** Disable haptic feedback for this button */
  noHaptic?: boolean;
}

export const TouchTriggerButton = React.forwardRef<
  HTMLButtonElement,
  TouchTriggerButtonProps
>(({ className, style, noHaptic, onPointerUp, ...props }, ref) => {
  // Trigger haptic on pointer up (after successful touch) for better feel
  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch" && !noHaptic) {
      triggerHaptic('selection');
    }
    onPointerUp?.(e);
  };

  return (
    <button
      ref={ref}
      style={style}
      onPointerUp={handlePointerUp}
      {...props}
      className={cn(
        "touch-manipulation min-h-[44px] min-w-[44px] [&_svg]:pointer-events-none active:scale-95 transition-transform",
        className
      )}
    />
  );
});
TouchTriggerButton.displayName = "TouchTriggerButton";
