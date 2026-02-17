import { useState, useEffect, useRef } from "react";
import { WifiOff, Wifi, Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

type NetworkQuality = "offline" | "slow" | "good" | "excellent";

interface NetworkConnection extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  }
}

function getNetworkQuality(): NetworkQuality {
  if (!navigator.onLine) return "offline";
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return "good"; // Default if API not available
  
  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink;
  
  if (effectiveType === "slow-2g" || effectiveType === "2g") {
    return "slow";
  }
  
  if (effectiveType === "3g" || (downlink && downlink < 1.5)) {
    return "good";
  }
  
  if (effectiveType === "4g" || (downlink && downlink >= 1.5)) {
    return "excellent";
  }
  
  return "good";
}

const qualityConfig: Record<NetworkQuality, { icon: typeof Wifi; label: string; color: string }> = {
  offline: {
    icon: WifiOff,
    label: "Offline",
    color: "text-destructive-foreground",
  },
  slow: {
    icon: SignalLow,
    label: "Slow",
    color: "text-yellow-400",
  },
  good: {
    icon: SignalMedium,
    label: "Good",
    color: "text-green-400",
  },
  excellent: {
    icon: SignalHigh,
    label: "Excellent",
    color: "text-emerald-400",
  },
};

export function OfflineIndicator() {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(getNetworkQuality);
  const wasOffline = useRef(false);
  const [showQuality, setShowQuality] = useState(false);
  const { trigger } = useHapticFeedback();

  useEffect(() => {
    const updateNetworkQuality = () => {
      const quality = getNetworkQuality();
      const wasOfflineState = networkQuality === "offline";
      
      if (wasOfflineState && quality !== "offline") {
        trigger("success");
        toast({
          title: "You're back online!",
          description: `Connection restored (${qualityConfig[quality].label})`,
        });
      } else if (!wasOfflineState && quality === "offline") {
        trigger("warning");
        wasOffline.current = true;
      }
      
      setNetworkQuality(quality);
    };

    const handleOnline = () => updateNetworkQuality();
    const handleOffline = () => updateNetworkQuality();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for connection changes if supported
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener("change", updateNetworkQuality);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", updateNetworkQuality);
      }
    };
  }, [networkQuality, trigger]);

  const isOffline = networkQuality === "offline";
  const config = qualityConfig[networkQuality];
  const Icon = config.icon;

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence mode="wait">
        {isOffline && (
          <motion.div
            key="offline-banner"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be unavailable.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network Quality Indicator (shown when online) */}
      {!isOffline && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 z-[90] w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background active:scale-95 transition-all touch-manipulation"
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') {
              trigger('light');
              setShowQuality(!showQuality);
            }
          }}
          onClick={(e) => {
            if ((e as any).pointerType === 'touch') return;
            trigger('light');
            setShowQuality(!showQuality);
          }}
          aria-label={`Network quality: ${config.label}`}
        >
          <Icon className={`h-5 w-5 ${config.color}`} />
          
          <AnimatePresence>
            {showQuality && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-background border border-border shadow-lg whitespace-nowrap"
              >
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label} connection
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </>
  );
}
