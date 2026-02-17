import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Battery, Wifi, ChevronDown, ChevronUp, Gauge, Hand, Zap } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useDevice } from '@/contexts/DeviceContext';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { cn } from '@/lib/utils';

interface PerformanceDashboardProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function PerformanceDashboard({ className, defaultExpanded = false }: PerformanceDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { metrics, getSuggestedMode, isPerformanceIssue, hasTouchLatencyIssue } = usePerformanceMonitor();
  const { device } = useDevice();
  const { settings } = useMotionSettings();

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getFpsBarColor = (fps: number) => {
    if (fps >= 55) return 'bg-emerald-400';
    if (fps >= 30) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getMemoryColor = (memory: number | null) => {
    if (memory === null) return 'text-muted-foreground';
    if (memory <= 50) return 'text-emerald-400';
    if (memory <= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryColor = (level: number | null, charging: boolean | null) => {
    if (charging) return 'text-emerald-400';
    if (level === null) return 'text-muted-foreground';
    if (level >= 50) return 'text-emerald-400';
    if (level >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLatencyColor = (latency: number) => {
    if (latency <= 50) return 'text-emerald-400';
    if (latency <= 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLatencyBarColor = (latency: number) => {
    if (latency <= 50) return 'bg-emerald-400';
    if (latency <= 100) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const suggestedMode = getSuggestedMode();
  const hasIssue = isPerformanceIssue || hasTouchLatencyIssue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'fixed bottom-4 left-4 z-50',
        'backdrop-blur-xl bg-card/80 border border-border/50 rounded-lg',
        'shadow-lg shadow-primary/10',
        'font-mono text-xs',
        className
      )}
    >
      {/* Header - Always visible */}
      <button
        onPointerDown={(e) => {
          if (e.pointerType === "touch") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        onClick={(e) => {
          if (e.detail === 0) return;
          setIsExpanded(!isExpanded);
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 w-full touch-manipulation min-h-[44px]',
          'hover:bg-secondary/30 transition-colors rounded-lg active:scale-[0.98]',
          hasIssue && 'bg-destructive/10'
        )}
      >
        <div className="relative">
          <Activity className={cn('w-4 h-4', getFpsColor(metrics.avgFps))} />
          {hasIssue && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          )}
        </div>
        
        <span className={cn('font-bold tabular-nums', getFpsColor(metrics.avgFps))}>
          {metrics.avgFps} FPS
        </span>
        
        {metrics.touchLatency.totalInteractions > 0 && (
          <span className={cn('text-[10px] tabular-nums', getLatencyColor(metrics.touchLatency.avgLatency))}>
            {metrics.touchLatency.avgLatency}ms
          </span>
        )}
        
        <div className="flex-1" />
        
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
              
              {/* FPS Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Frame Rate</span>
                  </div>
                  <span className={cn('tabular-nums font-medium', getFpsColor(metrics.fps))}>
                    {metrics.fps} / {metrics.avgFps} avg
                  </span>
                </div>
                <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', getFpsBarColor(metrics.avgFps))}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((metrics.avgFps / 60) * 100, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Memory</span>
                  </div>
                  <span className={cn('tabular-nums font-medium', getMemoryColor(metrics.memoryUsage))}>
                    {metrics.memoryUsage !== null ? `${metrics.memoryUsage}%` : 'N/A'}
                  </span>
                </div>
                {metrics.memoryUsage !== null && (
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        metrics.memoryUsage <= 50 ? 'bg-emerald-400' :
                        metrics.memoryUsage <= 80 ? 'bg-yellow-400' : 'bg-red-400'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.memoryUsage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>

              {/* Touch Latency */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Hand className={cn('w-3 h-3', getLatencyColor(metrics.touchLatency.avgLatency))} />
                    <span className="text-muted-foreground">Touch Latency</span>
                  </div>
                  <span className={cn('tabular-nums font-medium', getLatencyColor(metrics.touchLatency.avgLatency))}>
                    {metrics.touchLatency.totalInteractions > 0 
                      ? `${metrics.touchLatency.avgLatency}ms avg`
                      : 'Tap to test'}
                  </span>
                </div>
                {metrics.touchLatency.totalInteractions > 0 && (
                  <>
                    <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', getLatencyBarColor(metrics.touchLatency.avgLatency))}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((metrics.touchLatency.avgLatency / 200) * 100, 100)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Last: {metrics.touchLatency.lastLatency}ms</span>
                      <span>Max: {metrics.touchLatency.maxLatency}ms</span>
                      <span>
                        Slow: {metrics.touchLatency.slowInteractions}/{metrics.touchLatency.totalInteractions}
                      </span>
                    </div>
                  </>
                )}
                {hasTouchLatencyIssue && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    ⚠️ High touch latency detected
                  </p>
                )}
              </div>

              {/* Battery Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Battery className={cn('w-3 h-3', getBatteryColor(metrics.batteryLevel, metrics.isCharging))} />
                  <span className="text-muted-foreground">Battery</span>
                </div>
                <span className={cn('tabular-nums font-medium', getBatteryColor(metrics.batteryLevel, metrics.isCharging))}>
                  {metrics.batteryLevel !== null ? (
                    <>
                      {metrics.batteryLevel}%
                      {metrics.isCharging && <span className="text-emerald-400 ml-1">⚡</span>}
                    </>
                  ) : 'N/A'}
                </span>
              </div>

              {/* Device Info */}
              <div className="pt-2 border-t border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Device</span>
                  <span className="text-foreground/80">
                    {device.isMobile ? '📱 Mobile' : device.isTablet ? '📱 Tablet' : '💻 Desktop'}
                    {device.isTouchDevice && ' (Touch)'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Screen</span>
                  <span className="text-foreground/80 tabular-nums">
                    {device.screenWidth}×{device.screenHeight}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">DPR</span>
                  <span className="text-foreground/80 tabular-nums">
                    {metrics.devicePixelRatio.toFixed(2)}
                  </span>
                </div>

                {metrics.connectionType && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Network</span>
                    </div>
                    <span className="text-foreground/80 uppercase">
                      {metrics.connectionType}
                    </span>
                  </div>
                )}
              </div>

              {/* Suggested Mode */}
              <div className="pt-2 border-t border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Mode</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                    settings.performanceMode === 'full' && 'bg-emerald-400/20 text-emerald-400',
                    settings.performanceMode === 'reduced' && 'bg-yellow-400/20 text-yellow-400',
                    settings.performanceMode === 'minimal' && 'bg-red-400/20 text-red-400',
                    settings.performanceMode === 'auto' && 'bg-blue-400/20 text-blue-400'
                  )}>
                    {settings.performanceMode}
                  </span>
                </div>
                
                {settings.performanceMode === 'auto' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span className="text-muted-foreground">Suggested</span>
                    </div>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                      suggestedMode === 'full' && 'bg-emerald-400/20 text-emerald-400',
                      suggestedMode === 'reduced' && 'bg-yellow-400/20 text-yellow-400',
                      suggestedMode === 'minimal' && 'bg-red-400/20 text-red-400'
                    )}>
                      {suggestedMode}
                    </span>
                  </div>
                )}

                {settings.autoAdjustEnabled && settings.performanceMode === 'auto' && (
                  <p className="text-[10px] text-blue-400/80 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    Auto-adjust active (threshold: {settings.latencyThreshold}ms)
                  </p>
                )}

                {metrics.isLowEndDevice && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Low-end device detected
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
