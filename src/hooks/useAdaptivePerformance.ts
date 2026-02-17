import { useEffect, useRef, useCallback } from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';

interface AdaptivePerformanceOptions {
  /** Latency threshold (ms) to trigger reduced mode */
  latencyThreshold?: number;
  /** Number of slow interactions to trigger mode change */
  slowInteractionThreshold?: number;
  /** Minimum time (ms) between mode changes */
  cooldownMs?: number;
  /** Enable automatic mode switching */
  enabled?: boolean;
}

export function useAdaptivePerformance(options: AdaptivePerformanceOptions = {}) {
  const {
    latencyThreshold = 120,
    slowInteractionThreshold = 5,
    cooldownMs = 5000,
    enabled = true,
  } = options;

  const { metrics, getSuggestedMode, hasTouchLatencyIssue } = usePerformanceMonitor();
  const { settings, setPerformanceMode, updateSettings } = useMotionSettings();
  
  const lastModeChangeRef = useRef<number>(0);
  const consecutiveIssuesRef = useRef<number>(0);
  const previousModeRef = useRef<string | null>(null);

  // Check if we should auto-adjust
  const shouldAutoAdjust = settings.performanceMode === 'auto' && enabled;

  // Evaluate performance and adjust mode
  const evaluatePerformance = useCallback(() => {
    if (!shouldAutoAdjust) return;

    const now = Date.now();
    const timeSinceLastChange = now - lastModeChangeRef.current;

    // Respect cooldown period
    if (timeSinceLastChange < cooldownMs) return;

    const { avgLatency, slowInteractions, totalInteractions } = metrics.touchLatency;
    const suggestedMode = getSuggestedMode();
    
    // Calculate slow interaction rate
    const slowRate = totalInteractions > 0 
      ? slowInteractions / totalInteractions 
      : 0;

    // Conditions for reducing performance
    const hasHighLatency = avgLatency > latencyThreshold;
    const hasTooManySlowInteractions = slowInteractions >= slowInteractionThreshold;
    const hasHighSlowRate = slowRate > 0.15; // More than 15% slow

    const needsReduction = hasHighLatency || hasTooManySlowInteractions || hasHighSlowRate;

    if (needsReduction) {
      consecutiveIssuesRef.current += 1;

      // Only change after consistent issues
      if (consecutiveIssuesRef.current >= 3) {
        if (suggestedMode === 'minimal' && settings.performanceMode !== 'minimal') {
          previousModeRef.current = settings.performanceMode;
          setPerformanceMode('minimal');
          lastModeChangeRef.current = now;
          consecutiveIssuesRef.current = 0;
          
          console.log('[Adaptive Performance] Switching to minimal mode due to latency issues');
        } else if (suggestedMode === 'reduced' && settings.performanceMode === 'full') {
          previousModeRef.current = settings.performanceMode;
          setPerformanceMode('reduced');
          lastModeChangeRef.current = now;
          consecutiveIssuesRef.current = 0;
          
          console.log('[Adaptive Performance] Switching to reduced mode');
        }
      }
    } else {
      // Reset counter when performance is good
      consecutiveIssuesRef.current = 0;

      // Consider restoring if performance improved
      if (previousModeRef.current && timeSinceLastChange > cooldownMs * 2) {
        const canRestore = 
          avgLatency < latencyThreshold * 0.7 &&
          slowRate < 0.05 &&
          metrics.avgFps >= 55;

        if (canRestore) {
          // Gradually restore - go to reduced first if coming from minimal
          if (settings.performanceMode === 'minimal') {
            setPerformanceMode('reduced');
            console.log('[Adaptive Performance] Restoring to reduced mode');
          } else if (settings.performanceMode === 'reduced' && previousModeRef.current === 'full') {
            setPerformanceMode('full');
            previousModeRef.current = null;
            console.log('[Adaptive Performance] Restoring to full mode');
          }
          lastModeChangeRef.current = now;
        }
      }
    }
  }, [
    shouldAutoAdjust,
    metrics,
    getSuggestedMode,
    settings.performanceMode,
    setPerformanceMode,
    latencyThreshold,
    slowInteractionThreshold,
    cooldownMs
  ]);

  // Run evaluation periodically
  useEffect(() => {
    if (!shouldAutoAdjust) return;

    // Initial check after a delay
    const initialTimeout = setTimeout(evaluatePerformance, 2000);

    // Periodic checks
    const interval = setInterval(evaluatePerformance, 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [shouldAutoAdjust, evaluatePerformance]);

  // Quick response to immediate latency spikes
  useEffect(() => {
    if (!shouldAutoAdjust) return;

    // Immediate response to severe latency
    if (metrics.touchLatency.lastLatency > 200) {
      const timeSinceLastChange = Date.now() - lastModeChangeRef.current;
      if (timeSinceLastChange > cooldownMs) {
        console.log('[Adaptive Performance] Immediate response to high latency spike');
        if (settings.performanceMode !== 'minimal') {
          previousModeRef.current = settings.performanceMode;
          setPerformanceMode('minimal');
          lastModeChangeRef.current = Date.now();
        }
      }
    }
  }, [metrics.touchLatency.lastLatency, shouldAutoAdjust, settings.performanceMode, setPerformanceMode, cooldownMs]);

  return {
    isAutoMode: shouldAutoAdjust,
    currentMode: settings.performanceMode,
    suggestedMode: getSuggestedMode(),
    hasTouchLatencyIssue,
    metrics: metrics.touchLatency,
    consecutiveIssues: consecutiveIssuesRef.current,
  };
}
