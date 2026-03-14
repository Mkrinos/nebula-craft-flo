import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Wand2, Loader2, X, Download, ArrowRight, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  originalPrompt: string;
}

const EDIT_PRESETS = [
  { label: 'Make it darker', instruction: 'Make this image darker and more moody' },
  { label: 'Add glow', instruction: 'Add a neon glow effect to this image' },
  { label: 'Watercolor', instruction: 'Transform this into a watercolor painting style' },
  { label: 'Night mode', instruction: 'Convert this to a nighttime scene with stars' },
  { label: 'More vibrant', instruction: 'Make the colors more vibrant and saturated' },
  { label: 'Add rain', instruction: 'Add rain and wet reflections to this scene' },
];

export default function ImageEditDialog({ open, onOpenChange, imageUrl, originalPrompt }: ImageEditDialogProps) {
  const { user } = useAuth();
  const [editInstruction, setEditInstruction] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const currentImage = editedImage || imageUrl;

  const handleEdit = async (instruction?: string) => {
    const finalInstruction = instruction || editInstruction;
    if (!finalInstruction.trim()) return;
    if (!user) {
      toast.error('Sign in to edit images');
      return;
    }

    setEditing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: `Edit this image: ${finalInstruction}. Original prompt: ${originalPrompt}`,
          saveToGallery: true
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.image) {
        setHistory(prev => [...prev, currentImage]);
        setEditedImage(data.image);
        toast.success('Image edited!');
        setEditInstruction('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Edit failed');
    } finally {
      setEditing(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setEditedImage(prev === imageUrl ? null : prev);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `nexustouch-edited-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded!');
  };

  const handleClose = () => {
    setEditedImage(null);
    setHistory([]);
    setEditInstruction('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-space-dark/95 backdrop-blur-xl border-neon-cyan/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <SciFiFrame glowIntensity="subtle" animated={false} className="p-6">
          <DialogClose
            className="absolute right-3 top-3 z-50 rounded-sm opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogClose>

          <DialogHeader className="mb-4">
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              Edit Image
            </DialogTitle>
          </DialogHeader>

          {/* Image preview */}
          <div className="aspect-video rounded-lg overflow-hidden border border-border/30 mb-4 bg-background/30">
            <img src={currentImage} alt="Edit preview" className="w-full h-full object-contain" />
          </div>

          {/* Edit presets */}
          <div className="mb-3">
            <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
              Quick edits
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EDIT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleEdit(preset.instruction)}
                  disabled={editing}
                  className="px-2.5 py-1 text-xs rounded-full border border-border/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom edit instruction */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              placeholder="Describe how to edit this image..."
              className="flex-1 px-3 py-2 text-sm bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
              disabled={editing}
            />
            <SciFiButton
              variant="primary"
              size="sm"
              onClick={() => handleEdit()}
              disabled={editing || !editInstruction.trim()}
            >
              {editing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            </SciFiButton>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <SciFiButton
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="gap-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </SciFiButton>
            </div>
            <div className="flex gap-2">
              <SciFiButton variant="ghost" size="sm" onClick={handleDownload} className="gap-1">
                <Download className="w-3.5 h-3.5" />
                Download
              </SciFiButton>
            </div>
          </div>
        </SciFiFrame>
      </DialogContent>
    </Dialog>
  );
}
