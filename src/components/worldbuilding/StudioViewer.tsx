import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StudioSpace, StudioDecoration, StudioPlacement } from '@/hooks/useStudioSpaces';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const BACKGROUND_STYLES: Record<string, string> = {
  gradient: 'bg-gradient-to-br from-amber-900/40 via-orange-800/30 to-rose-900/40',
  starfield: 'bg-gradient-to-br from-indigo-950 via-purple-900/80 to-violet-950',
  crystals: 'bg-gradient-to-br from-cyan-950 via-teal-900/80 to-emerald-950',
  clouds: 'bg-gradient-to-br from-sky-200/40 via-blue-100/30 to-cyan-200/40',
  neon: 'bg-gradient-to-br from-pink-950 via-fuchsia-900/80 to-violet-950',
  books: 'bg-gradient-to-br from-amber-900/50 via-yellow-800/40 to-orange-900/50',
};

interface PlacedDecoration extends StudioPlacement {
  decoration: StudioDecoration;
}

interface StudioViewerProps {
  studio: StudioSpace | null;
  placements: PlacedDecoration[];
  decorations: StudioDecoration[];
  onPlaceDecoration?: (decorationId: string, position: { x: number; y: number }) => void;
  onRemoveDecoration?: (placementId: string) => void;
  selectedDecoration?: string | null;
  isEditMode?: boolean;
}

export function StudioViewer({
  studio,
  placements,
  decorations,
  onPlaceDecoration,
  onRemoveDecoration,
  selectedDecoration,
  isEditMode = false,
}: StudioViewerProps) {
  const { trigger } = useHapticFeedback();
  
  if (!studio) {
    return (
      <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/10">
        <div className="text-center text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No studio selected</p>
        </div>
      </div>
    );
  }

  const backgroundStyle = BACKGROUND_STYLES[studio.background_style] || BACKGROUND_STYLES.gradient;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || !selectedDecoration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    trigger('medium');
    onPlaceDecoration?.(selectedDecoration, { x, y });
  };

  return (
    <div className="relative">
      {/* Studio viewport */}
      <motion.div
        className={cn(
          "aspect-video rounded-xl overflow-hidden relative",
          backgroundStyle,
          isEditMode && selectedDecoration && "cursor-crosshair"
        )}
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background elements based on theme */}
        {studio.background_style === 'starfield' && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 1 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}

        {studio.background_style === 'crystals' && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-8 bg-gradient-to-t from-cyan-400/30 to-transparent"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: '0%',
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {studio.background_style === 'neon' && (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(236,72,153,0.3) 20px, rgba(236,72,153,0.3) 21px)',
              }}
              animate={{ y: [0, 20] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
        
        {/* Placed decorations */}
        <AnimatePresence>
          {placements.map((placement) => (
            <motion.div
              key={placement.id}
              className="absolute group"
              style={{
                left: `${placement.position_x}%`,
                top: `${placement.position_y}%`,
                transform: `translate(-50%, -50%) scale(${placement.scale}) rotate(${placement.rotation}deg)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: placement.scale, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: placement.scale * 1.1 }}
            >
              <span className="text-4xl drop-shadow-lg">
                {placement.decoration.icon}
              </span>
              
              {/* Remove button in edit mode */}
              {isEditMode && (
                <motion.button
                  className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation active:scale-90"
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.stopPropagation();
                      trigger('warning');
                      onRemoveDecoration?.(placement.id);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    trigger('warning');
                    onRemoveDecoration?.(placement.id);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove decoration"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Edit mode overlay */}
        {isEditMode && (
          <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-xl pointer-events-none">
            {selectedDecoration && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                <Plus className="w-3 h-3" />
                Click to place decoration
              </div>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Studio name badge */}
      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className="text-sm font-medium">{studio.name}</span>
      </div>
    </div>
  );
}
