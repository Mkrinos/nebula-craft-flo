import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { X, Eye, EyeOff, Bug, Trash2, Volume2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback, HapticIntensity } from '@/hooks/useHapticFeedback';

interface TapInfo {
  x: number;
  y: number;
  target: string;
  blocked: boolean;
  timestamp: number;
  hapticTriggered?: HapticIntensity;
}

interface HighlightedElement {
  element: Element;
  rect: DOMRect;
  size: { width: number; height: number };
  isAdequate: boolean;
  type: 'button' | 'link' | 'input' | 'interactive';
}

const INTERACTIVE_SELECTORS = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="slider"]',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[data-radix-collection-item]',
].join(',');

const MIN_TOUCH_TARGET = 44; // Minimum recommended touch target size

// Global event for external toggle (e.g., from SettingsPopover)
export const TOUCH_DIAGNOSTICS_TOGGLE_EVENT = 'touch-diagnostics-toggle';

export function TouchDiagnostics() {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('touch-diagnostics-enabled') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized to be non-intrusive
  const [lastTap, setLastTap] = useState<TapInfo | null>(null);
  const [tapHistory, setTapHistory] = useState<TapInfo[]>([]);
  const [blockedElements, setBlockedElements] = useState<Set<string>>(new Set());
  const [hapticTestMode, setHapticTestMode] = useState(false);
  const [targetHighlightMode, setTargetHighlightMode] = useState(false);
  const [highlightedElements, setHighlightedElements] = useState<HighlightedElement[]>([]);
  const [highlightStats, setHighlightStats] = useState({ total: 0, adequate: 0, small: 0 });
  const haptic = useHapticFeedback();

  // Listen for external toggle events (from SettingsPopover)
  useEffect(() => {
    const handleExternalToggle = (e: CustomEvent<{ enabled: boolean }>) => {
      setIsEnabled(e.detail.enabled);
    };
    window.addEventListener(TOUCH_DIAGNOSTICS_TOGGLE_EVENT, handleExternalToggle as EventListener);
    return () => {
      window.removeEventListener(TOUCH_DIAGNOSTICS_TOGGLE_EVENT, handleExternalToggle as EventListener);
    };
  }, []);

  // Persist enabled state
  useEffect(() => {
    localStorage.setItem('touch-diagnostics-enabled', String(isEnabled));
  }, [isEnabled]);

  const getElementDescription = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = el.className && typeof el.className === 'string' 
      ? `.${el.className.split(' ').slice(0, 2).join('.')}` 
      : '';
    const ariaLabel = el.getAttribute('aria-label');
    const role = el.getAttribute('role');
    const text = el.textContent?.trim().slice(0, 15) || '';
    
    let desc = `${tag}${id}${classes}`;
    if (ariaLabel) desc += ` [${ariaLabel}]`;
    else if (role) desc += ` [${role}]`;
    else if (text) desc += ` "${text}..."`;
    
    return desc.slice(0, 60);
  };

  const checkIfBlocked = useCallback((x: number, y: number, target: Element): boolean => {
    const elementsAtPoint = document.elementsFromPoint(x, y);
    if (elementsAtPoint.length === 0) return false;
    
    const topElement = elementsAtPoint[0];
    if (topElement === target) return false;

    // Check if top element has pointer-events: none
    const style = window.getComputedStyle(topElement);
    if (style.pointerEvents === 'none') return false;

    // Check if it's a known overlay/backdrop or diagnostic element
    const isIgnored = topElement.classList.contains('backdrop') || 
                      topElement.classList.contains('overlay') ||
                      topElement.classList.contains('touch-diagnostics-indicator') ||
                      topElement.hasAttribute('data-overlay') ||
                      topElement.closest('[data-touch-diagnostics]');
    
    return !isIgnored && elementsAtPoint.indexOf(target) > 0;
  }, []);

  const detectHapticPattern = (el: Element): HapticIntensity | undefined => {
    // Detect what type of interactive element was tapped
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const classes = el.className?.toString() || '';
    
    if (tag === 'button' || role === 'button') return 'button-press';
    if (tag === 'a' || role === 'link') return 'navigation';
    if (classes.includes('tab')) return 'selection';
    if (classes.includes('switch') || classes.includes('toggle')) return 'selection';
    if (classes.includes('slider')) return 'light';
    
    return undefined;
  };

  const handleGlobalTap = useCallback((e: PointerEvent) => {
    if (!isEnabled) return;
    
    const target = e.target as Element;
    
    // Skip if tapping on diagnostics panel itself
    if (target.closest('[data-touch-diagnostics]')) return;
    
    const blocked = checkIfBlocked(e.clientX, e.clientY, target);
    const hapticType = detectHapticPattern(target);
    
    const tapInfo: TapInfo = {
      x: e.clientX,
      y: e.clientY,
      target: getElementDescription(target),
      blocked,
      timestamp: Date.now(),
      hapticTriggered: hapticType,
    };

    setLastTap(tapInfo);
    setTapHistory(prev => [tapInfo, ...prev].slice(0, 15));

    if (blocked) {
      setBlockedElements(prev => new Set(prev).add(tapInfo.target));
      console.warn(`[TouchDiag] ❌ BLOCKED tap at (${e.clientX}, ${e.clientY}):`, tapInfo.target);
    } else {
      console.log(`[TouchDiag] ✅ OK at (${e.clientX}, ${e.clientY}):`, tapInfo.target, hapticType ? `[haptic: ${hapticType}]` : '');
    }

    // Test haptic on tap if enabled
    if (hapticTestMode && hapticType && !blocked) {
      haptic.trigger(hapticType);
    }

    // Visual feedback
    const indicator = document.createElement('div');
    indicator.className = 'touch-diagnostics-indicator';
    indicator.style.cssText = `
      position: fixed;
      left: ${e.clientX - 15}px;
      top: ${e.clientY - 15}px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid ${blocked ? 'hsl(var(--destructive))' : 'hsl(var(--neon-cyan))'};
      background: ${blocked ? 'hsla(var(--destructive), 0.2)' : 'hsla(var(--neon-cyan), 0.2)'};
      pointer-events: none;
      z-index: 99999;
      animation: touchPulse 0.5s ease-out forwards;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 500);
  }, [isEnabled, checkIfBlocked, hapticTestMode, haptic]);

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('pointerdown', handleGlobalTap, { capture: true });
      
      // Add animation keyframes
      const style = document.createElement('style');
      style.id = 'touch-diagnostics-styles';
      style.textContent = `
        @keyframes touchPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.removeEventListener('pointerdown', handleGlobalTap, { capture: true });
        document.getElementById('touch-diagnostics-styles')?.remove();
      };
    }
  }, [isEnabled, handleGlobalTap]);

  // Always show diagnostics button (useful for testing in all environments)
  const showButton = true;

  const toggleHapticTest = () => {
    setHapticTestMode(prev => !prev);
    haptic.trigger(hapticTestMode ? 'light' : 'success');
  };

  // Scan and highlight all interactive elements
  const scanInteractiveElements = useCallback(() => {
    const elements = document.querySelectorAll(INTERACTIVE_SELECTORS);
    const highlighted: HighlightedElement[] = [];
    let adequate = 0;
    let small = 0;

    elements.forEach((el) => {
      // Skip hidden elements and diagnostic elements
      if (el.closest('[data-touch-diagnostics]')) return;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Determine element type
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      let type: HighlightedElement['type'] = 'interactive';
      if (tag === 'button' || role === 'button') type = 'button';
      else if (tag === 'a' || role === 'link') type = 'link';
      else if (['input', 'select', 'textarea'].includes(tag)) type = 'input';

      // Check if touch target is adequate (at least 44x44)
      const isAdequate = rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
      if (isAdequate) adequate++;
      else small++;

      highlighted.push({
        element: el,
        rect,
        size: { width: rect.width, height: rect.height },
        isAdequate,
        type,
      });
    });

    setHighlightedElements(highlighted);
    setHighlightStats({ total: highlighted.length, adequate, small });
  }, []);

  // Toggle target highlight mode
  const toggleTargetHighlight = () => {
    const newMode = !targetHighlightMode;
    setTargetHighlightMode(newMode);
    haptic.trigger(newMode ? 'success' : 'light');
    
    if (newMode) {
      scanInteractiveElements();
    } else {
      setHighlightedElements([]);
    }
  };

  // Rescan on scroll/resize when highlight mode is active
  useEffect(() => {
    if (!targetHighlightMode) return;

    const handleUpdate = () => {
      requestAnimationFrame(scanInteractiveElements);
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });
    
    // Rescan periodically to catch dynamic elements
    const interval = setInterval(scanInteractiveElements, 1000);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(interval);
    };
  }, [targetHighlightMode, scanInteractiveElements]);

  return (
    <>
      {/* Static Toggle Button - Fixed at bottom-left, non-intrusive */}
      <div
        data-touch-diagnostics
        className="fixed z-[9999] left-2 bottom-2 flex items-center"
      >
        {/* Toggle Button */}
        <button
          onClick={() => {
            setIsEnabled(!isEnabled);
            haptic.trigger('button-press');
          }}
          className={cn(
            "h-8 rounded-full shadow-lg touch-manipulation",
            "border transition-all min-h-[44px] min-w-[44px] px-3 gap-2 flex items-center select-none",
            "active:scale-95 active:opacity-90",
            isEnabled 
              ? "border-neon-cyan bg-neon-cyan/20 text-neon-cyan" 
              : "border-border/50 bg-background/60 text-muted-foreground hover:bg-background/80"
          )}
          title="Toggle Touch Diagnostics"
        >
          <Bug className="h-4 w-4 pointer-events-none" />
          <span className="text-[10px] font-medium pointer-events-none hidden sm:inline">Touch Test</span>
        </button>
      </div>

      {/* Diagnostics Panel - Fixed position next to toggle */}
      {isEnabled && (
        <div 
          data-touch-diagnostics
          className={cn(
            "fixed z-[9999] left-2 bottom-14 bg-background/95 backdrop-blur-xl border border-border rounded-lg shadow-xl transition-all",
            isMinimized ? "w-auto" : "w-72 max-h-80"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-xs font-display uppercase tracking-wider text-neon-cyan">
              Touch Diagnostics
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTargetHighlight}
                className={cn(
                  "h-6 w-6 touch-manipulation",
                  targetHighlightMode && "text-neon-cyan bg-neon-cyan/10"
                )}
                title="Highlight touch targets"
              >
                <Target className="h-3 w-3 pointer-events-none" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHapticTest}
                className={cn(
                  "h-6 w-6 touch-manipulation",
                  hapticTestMode && "text-neon-magenta bg-neon-magenta/10"
                )}
                title="Toggle haptic test mode"
              >
                <Volume2 className="h-3 w-3 pointer-events-none" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTapHistory([]);
                  setBlockedElements(new Set());
                  setLastTap(null);
                  haptic.trigger('light');
                }}
                className="h-6 w-6 touch-manipulation"
                title="Clear history"
              >
                <Trash2 className="h-3 w-3 pointer-events-none" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 touch-manipulation"
              >
                {isMinimized ? <Eye className="h-3 w-3 pointer-events-none" /> : <EyeOff className="h-3 w-3 pointer-events-none" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEnabled(false);
                  haptic.trigger('light');
                }}
                className="h-6 w-6 touch-manipulation"
              >
                <X className="h-3 w-3 pointer-events-none" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
              {/* Status Bar */}
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className={cn(
                  "px-2 py-0.5 rounded-full",
                  haptic.isSupported ? "bg-green-500/20 text-green-400" : 
                  haptic.hasVisualFallback ? "bg-amber-500/20 text-amber-400" : 
                  "bg-destructive/20 text-destructive"
                )}>
                  Haptics: {haptic.isSupported ? 'Native' : haptic.hasVisualFallback ? 'Visual' : 'OFF'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {haptic.isIOS ? 'iOS (No Vibrate API)' : haptic.isAndroid ? 'Android' : 'Desktop'}
                </span>
                {hapticTestMode && (
                  <span className="px-2 py-0.5 rounded-full bg-neon-magenta/20 text-neon-magenta animate-pulse">
                    Haptic Test
                  </span>
                )}
              </div>

              {/* Target Highlight Stats */}
              {targetHighlightMode && (
                <div className="p-2 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-neon-cyan">
                      🎯 Touch Targets
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          scanInteractiveElements();
                          haptic.trigger('light');
                        }}
                        className="h-5 w-5 touch-manipulation"
                        title="Rescan touch targets"
                      >
                        <RefreshCw className="h-3 w-3 pointer-events-none" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground">
                        {highlightStats.total} found
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-green-400">{highlightStats.adequate} OK</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-amber-400">{highlightStats.small} Too Small</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Min target: {MIN_TOUCH_TARGET}×{MIN_TOUCH_TARGET}px
                  </p>
                </div>
              )}

              {/* Last Tap */}
              {lastTap && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Tap</p>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    lastTap.blocked 
                      ? "bg-destructive/10 border border-destructive/30" 
                      : "bg-neon-cyan/10 border border-neon-cyan/30"
                  )}>
                    <p className="truncate font-mono text-[10px]">{lastTap.target}</p>
                    <div className="flex items-center justify-between mt-1 text-muted-foreground">
                      <span>({lastTap.x}, {lastTap.y})</span>
                      <div className="flex items-center gap-2">
                        {lastTap.hapticTriggered && (
                          <span className="text-neon-magenta text-[9px]">🎵 {lastTap.hapticTriggered}</span>
                        )}
                        {lastTap.blocked && <span className="text-destructive font-bold">BLOCKED</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocked Elements */}
              {blockedElements.size > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-destructive">
                    ⚠️ Blocked Elements ({blockedElements.size})
                  </p>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {Array.from(blockedElements).map((el, i) => (
                      <p key={i} className="text-[10px] font-mono truncate text-destructive/80 bg-destructive/5 px-1 rounded">
                        {el}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tap History */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tap History ({tapHistory.length})
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {tapHistory.map((tap, i) => (
                    <div 
                      key={tap.timestamp + i} 
                      className={cn(
                        "text-[10px] font-mono truncate flex items-center gap-1 px-1 rounded",
                        tap.blocked ? "text-destructive bg-destructive/5" : "text-foreground/70"
                      )}
                    >
                      <span>{tap.blocked ? '❌' : '✅'}</span>
                      <span className="truncate flex-1">{tap.target}</span>
                      {tap.hapticTriggered && (
                        <span className="text-neon-magenta/60 flex-shrink-0">🎵</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {tapHistory.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-4">
                  Tap anywhere to start recording
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Touch Target Overlays */}
      {targetHighlightMode && highlightedElements.map((item, index) => {
        const colorClass = item.isAdequate 
          ? 'border-green-500 bg-green-500/10' 
          : 'border-amber-500 bg-amber-500/15';
        const labelColor = item.isAdequate ? 'bg-green-500' : 'bg-amber-500';
        
        return (
          <div
            key={index}
            data-touch-diagnostics
            className={cn(
              "fixed pointer-events-none z-[9998] border-2 rounded-sm transition-opacity",
              colorClass
            )}
            style={{
              left: item.rect.left,
              top: item.rect.top,
              width: item.rect.width,
              height: item.rect.height,
            }}
          >
            {/* Size label */}
            <div 
              className={cn(
                "absolute -top-4 left-0 px-1 py-0.5 rounded text-[8px] font-mono text-white whitespace-nowrap",
                labelColor
              )}
            >
              {Math.round(item.size.width)}×{Math.round(item.size.height)}
            </div>
            {/* Type indicator */}
            <div className="absolute bottom-0 right-0 p-0.5 text-[8px] opacity-70">
              {item.type === 'button' && '🔘'}
              {item.type === 'link' && '🔗'}
              {item.type === 'input' && '✏️'}
              {item.type === 'interactive' && '👆'}
            </div>
          </div>
        );
      })}
    </>
  );
}
