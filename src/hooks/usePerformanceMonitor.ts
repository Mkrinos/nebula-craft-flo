import { useState, useEffect, useCallback, useRef } from 'react';

export interface TouchLatencyMetrics {
  lastLatency: number;
  avgLatency: number;
  maxLatency: number;
  slowInteractions: number;
  totalInteractions: number;
}

export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  memoryUsage: number | null;
  devicePixelRatio: number;
  isLowEndDevice: boolean;
  connectionType: string | null;
  batteryLevel: number | null;
  isCharging: boolean | null;
  touchLatency: TouchLatencyMetrics;
}

interface PerformanceMonitorOptions {
  sampleSize?: number;
  throttleMs?: number;
  enableMemoryTracking?: boolean;
}

export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const { sampleSize = 60, throttleMs = 1000, enableMemoryTracking = true } = options;
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    avgFps: 60,
    memoryUsage: null,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isLowEndDevice: false,
    connectionType: null,
    batteryLevel: null,
    isCharging: null,
    touchLatency: {
      lastLatency: 0,
      avgLatency: 0,
      maxLatency: 0,
      slowInteractions: 0,
      totalInteractions: 0,
    },
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const touchLatenciesRef = useRef<number[]>([]);
  const slowInteractionsRef = useRef<number>(0);
  const totalInteractionsRef = useRef<number>(0);

  // Detect low-end device characteristics
  const detectDeviceCapabilities = useCallback(() => {
    const nav = navigator as any;
    
    // Check hardware concurrency (CPU cores)
    const cores = nav.hardwareConcurrency || 4;
    
    // Check device memory (in GB)
    const memory = nav.deviceMemory || 4;
    
    // Check connection type
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const connectionType = connection?.effectiveType || null;
    
    // Low-end detection heuristics
    const isLowEnd = cores <= 2 || memory <= 2 || 
      connectionType === 'slow-2g' || connectionType === '2g';
    
    return { isLowEnd, connectionType, cores, memory };
  }, []);

  // Get memory usage if available
  const getMemoryUsage = useCallback(() => {
    if (!enableMemoryTracking) return null;
    
    const perf = performance as any;
    if (perf.memory) {
      return Math.round((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100);
    }
    return null;
  }, [enableMemoryTracking]);

  // Track touch interaction latency
  const trackTouchLatency = useCallback((latencyMs: number) => {
    totalInteractionsRef.current += 1;
    touchLatenciesRef.current.push(latencyMs);
    
    // Keep only last 50 samples
    if (touchLatenciesRef.current.length > 50) {
      touchLatenciesRef.current.shift();
    }
    
    // Count slow interactions (>100ms is considered slow)
    if (latencyMs > 100) {
      slowInteractionsRef.current += 1;
    }
    
    const avgLatency = touchLatenciesRef.current.reduce((a, b) => a + b, 0) / touchLatenciesRef.current.length;
    const maxLatency = Math.max(...touchLatenciesRef.current);
    
    setMetrics(prev => ({
      ...prev,
      touchLatency: {
        lastLatency: Math.round(latencyMs),
        avgLatency: Math.round(avgLatency),
        maxLatency: Math.round(maxLatency),
        slowInteractions: slowInteractionsRef.current,
        totalInteractions: totalInteractionsRef.current,
      },
    }));
  }, []);

  // Global touch event listener to measure latency
  useEffect(() => {
    let touchStartTime = 0;
    
    const handleTouchStart = () => {
      touchStartTime = performance.now();
    };
    
    const handleTouchEnd = () => {
      if (touchStartTime > 0) {
        const latency = performance.now() - touchStartTime;
        trackTouchLatency(latency);
        touchStartTime = 0;
      }
    };
    
    const handlePointerDown = () => {
      touchStartTime = performance.now();
    };
    
    const handlePointerUp = () => {
      if (touchStartTime > 0) {
        const latency = performance.now() - touchStartTime;
        trackTouchLatency(latency);
        touchStartTime = 0;
      }
    };

    // Track both touch and pointer events for comprehensive coverage
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [trackTouchLatency]);

  // Battery status
  useEffect(() => {
    const nav = navigator as any;
    if (nav.getBattery) {
      nav.getBattery().then((battery: any) => {
        const updateBattery = () => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        };
        
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        
        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      }).catch(() => {
        // Battery API not available
      });
    }
  }, []);

  // FPS monitoring loop
  useEffect(() => {
    const { isLowEnd, connectionType } = detectDeviceCapabilities();
    
    setMetrics(prev => ({
      ...prev,
      isLowEndDevice: isLowEnd,
      connectionType,
    }));

    const measureFrame = (timestamp: number) => {
      const delta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      if (delta > 0) {
        const currentFps = Math.round(1000 / delta);
        frameTimesRef.current.push(currentFps);
        
        // Keep only recent samples
        if (frameTimesRef.current.length > sampleSize) {
          frameTimesRef.current.shift();
        }
        
        // Throttle state updates
        if (timestamp - lastUpdateRef.current >= throttleMs) {
          lastUpdateRef.current = timestamp;
          
          const avgFps = Math.round(
            frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
          );
          
          setMetrics(prev => ({
            ...prev,
            fps: currentFps,
            avgFps,
            memoryUsage: getMemoryUsage(),
            devicePixelRatio: window.devicePixelRatio,
          }));
        }
      }
      
      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    rafIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [sampleSize, throttleMs, detectDeviceCapabilities, getMemoryUsage]);

  // Suggested performance mode based on metrics
  const getSuggestedMode = useCallback((): 'full' | 'reduced' | 'minimal' => {
    const { avgFps, isLowEndDevice, batteryLevel, isCharging, memoryUsage, touchLatency } = metrics;
    
    // High touch latency - reduce animations
    if (touchLatency.avgLatency > 150) {
      return 'minimal';
    }
    
    // Low battery and not charging - go minimal
    if (batteryLevel !== null && batteryLevel < 20 && !isCharging) {
      return 'minimal';
    }
    
    // High memory usage
    if (memoryUsage !== null && memoryUsage > 80) {
      return 'minimal';
    }
    
    // Low FPS or low-end device
    if (avgFps < 30 || isLowEndDevice) {
      return 'minimal';
    }
    
    if (avgFps < 50 || touchLatency.avgLatency > 80) {
      return 'reduced';
    }
    
    return 'full';
  }, [metrics]);

  // Check for touch latency issues
  const hasTouchLatencyIssue = metrics.touchLatency.avgLatency > 100 || 
    (metrics.touchLatency.slowInteractions / Math.max(metrics.touchLatency.totalInteractions, 1)) > 0.1;

  return {
    metrics,
    getSuggestedMode,
    trackTouchLatency,
    isPerformanceIssue: metrics.avgFps < 30 || (metrics.memoryUsage !== null && metrics.memoryUsage > 80),
    hasTouchLatencyIssue,
  };
}
