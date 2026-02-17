import { useCallback, useRef } from 'react';
import { triggerHaptic, HapticIntensity } from './useHapticFeedback';

interface ReorderHapticsOptions {
  enabled?: boolean;
  pickupIntensity?: HapticIntensity;
  moveIntensity?: HapticIntensity;
  dropIntensity?: HapticIntensity;
  moveCooldown?: number; // ms between move haptics
}

const DEFAULT_OPTIONS: ReorderHapticsOptions = {
  enabled: true,
  pickupIntensity: 'medium',
  moveIntensity: 'light',
  dropIntensity: 'success',
  moveCooldown: 50,
};

// Storage key for settings
const STORAGE_KEY = 'reorder-haptics';

export const getReorderHapticsSettings = (): ReorderHapticsOptions => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_OPTIONS;
};

export const saveReorderHapticsSettings = (settings: Partial<ReorderHapticsOptions>) => {
  const current = getReorderHapticsSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};

/**
 * Hook providing haptic feedback for drag-and-drop reordering operations
 */
export const useReorderHaptics = (options: Partial<ReorderHapticsOptions> = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const lastMoveHapticRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(-1);
  const isDraggingRef = useRef<boolean>(false);

  /**
   * Trigger haptic when user picks up an item
   */
  const onDragStart = useCallback((index?: number) => {
    if (!mergedOptions.enabled) return;
    
    isDraggingRef.current = true;
    currentIndexRef.current = index ?? -1;
    triggerHaptic(mergedOptions.pickupIntensity ?? 'medium');
  }, [mergedOptions.enabled, mergedOptions.pickupIntensity]);

  /**
   * Trigger haptic when item moves to a new position
   */
  const onPositionChange = useCallback((newIndex: number) => {
    if (!mergedOptions.enabled || !isDraggingRef.current) return;
    
    // Only trigger if position actually changed
    if (newIndex === currentIndexRef.current) return;
    
    const now = Date.now();
    if (now - lastMoveHapticRef.current < (mergedOptions.moveCooldown ?? 50)) return;
    
    lastMoveHapticRef.current = now;
    currentIndexRef.current = newIndex;
    triggerHaptic(mergedOptions.moveIntensity ?? 'light');
  }, [mergedOptions.enabled, mergedOptions.moveIntensity, mergedOptions.moveCooldown]);

  /**
   * Trigger haptic when item is dropped
   */
  const onDragEnd = useCallback((didMove?: boolean) => {
    if (!mergedOptions.enabled) return;
    
    isDraggingRef.current = false;
    
    // Only trigger success haptic if item actually moved
    if (didMove !== false) {
      triggerHaptic(mergedOptions.dropIntensity ?? 'success');
    } else {
      // Light haptic for cancelled/same-position drops
      triggerHaptic('light');
    }
    
    currentIndexRef.current = -1;
  }, [mergedOptions.enabled, mergedOptions.dropIntensity]);

  /**
   * Trigger haptic for drag cancel
   */
  const onDragCancel = useCallback(() => {
    if (!mergedOptions.enabled) return;
    
    isDraggingRef.current = false;
    currentIndexRef.current = -1;
    triggerHaptic('light');
  }, [mergedOptions.enabled]);

  return {
    onDragStart,
    onPositionChange,
    onDragEnd,
    onDragCancel,
    isDragging: isDraggingRef.current,
  };
};

/**
 * Pre-configured haptic handlers for @dnd-kit
 * Use with DndContext onDragStart, onDragOver, onDragEnd, onDragCancel
 */
export const createDndKitHaptics = (options: Partial<ReorderHapticsOptions> = {}) => {
  const mergedOptions = { ...getReorderHapticsSettings(), ...options };
  let lastMoveHaptic = 0;
  let currentOverId: string | null = null;

  return {
    onDragStart: () => {
      if (!mergedOptions.enabled) return;
      triggerHaptic(mergedOptions.pickupIntensity ?? 'medium');
    },
    
    onDragOver: (event: { over: { id: string } | null }) => {
      if (!mergedOptions.enabled) return;
      
      const newOverId = event.over?.id ?? null;
      if (newOverId === currentOverId) return;
      
      const now = Date.now();
      if (now - lastMoveHaptic < (mergedOptions.moveCooldown ?? 50)) return;
      
      lastMoveHaptic = now;
      currentOverId = newOverId;
      
      if (newOverId) {
        triggerHaptic(mergedOptions.moveIntensity ?? 'light');
      }
    },
    
    onDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => {
      if (!mergedOptions.enabled) return;
      
      const didMove = event.over && event.active.id !== event.over.id;
      triggerHaptic(didMove ? (mergedOptions.dropIntensity ?? 'success') : 'light');
      currentOverId = null;
    },
    
    onDragCancel: () => {
      if (!mergedOptions.enabled) return;
      triggerHaptic('light');
      currentOverId = null;
    },
  };
};

/**
 * Pre-configured haptic handlers for framer-motion Reorder
 * Use with Reorder.Group and Reorder.Item
 */
export const createFramerReorderHaptics = (options: Partial<ReorderHapticsOptions> = {}) => {
  const mergedOptions = { ...getReorderHapticsSettings(), ...options };
  let lastIndex = -1;
  let lastMoveHaptic = 0;

  return {
    onDragStart: () => {
      if (!mergedOptions.enabled) return;
      triggerHaptic(mergedOptions.pickupIntensity ?? 'medium');
    },
    
    // Call this in onReorder callback with the new index of the dragged item
    onReorder: (newIndex: number) => {
      if (!mergedOptions.enabled) return;
      if (newIndex === lastIndex) return;
      
      const now = Date.now();
      if (now - lastMoveHaptic < (mergedOptions.moveCooldown ?? 50)) return;
      
      lastMoveHaptic = now;
      lastIndex = newIndex;
      triggerHaptic(mergedOptions.moveIntensity ?? 'light');
    },
    
    onDragEnd: () => {
      if (!mergedOptions.enabled) return;
      triggerHaptic(mergedOptions.dropIntensity ?? 'success');
      lastIndex = -1;
    },
  };
};
