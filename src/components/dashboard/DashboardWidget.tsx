import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { cn } from '@/lib/utils';

export interface WidgetConfig {
  id: string;
  type: 'stats' | 'quick-actions' | 'social-feed' | 'tips' | 'quests' | 'creators';
  title: string;
  size: 'small' | 'medium' | 'large';
  isVisible: boolean;
}

interface DashboardWidgetProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  isEditing: boolean;
  onRemove?: () => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
}

export function DashboardWidget({ 
  widget, 
  children, 
  isEditing, 
  onRemove, 
  onResize 
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 sm:col-span-2 lg:col-span-1',
    large: 'col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-3'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClasses[widget.size],
        isDragging && 'z-50 opacity-90',
        'transition-all duration-200'
      )}
    >
      <SciFiFrame 
        animated={!isEditing}
        glowIntensity={isDragging ? 'strong' : 'subtle'}
        className={cn(
          'h-full',
          isEditing && 'ring-2 ring-neon-cyan/50 ring-dashed'
        )}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            {isEditing && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-neon-cyan transition-colors touch-none"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
            )}
            <h3 className="font-display text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
              {widget.title}
            </h3>
          </div>

          {isEditing && (
            <div className="flex items-center gap-1">
              <SciFiButton
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                  const currentIndex = sizes.indexOf(widget.size);
                  const nextSize = sizes[(currentIndex + 1) % sizes.length];
                  onResize?.(nextSize);
                }}
              >
                {widget.size === 'large' ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </SciFiButton>
              <SciFiButton
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <X className="w-3 h-3" />
              </SciFiButton>
            </div>
          )}
        </div>

        {/* Widget Content */}
        <div className="p-2.5 sm:p-3">
          {children}
        </div>
      </SciFiFrame>
    </div>
  );
}