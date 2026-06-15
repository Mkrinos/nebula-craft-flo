import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreationJourney, generalCreateDefinition } from '@/modules/creation';
import { invokeGenerateImage } from '@/modules/creation/generateAdapter';
import { toast } from 'sonner';

export function QuickGenerateWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const launch = () => {
    if (!user) {
      toast.error('Sign in to start creating');
      return;
    }
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#5BCEFA]/30 bg-[#0A1A3D]/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#5BCEFA]" />
          <p className="font-display text-sm text-[#B8A4E3]">
            Tap to build, name, and claim your creation.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          The guided journey walks you through every step — no typing required.
        </p>
      </div>

      <div className="flex gap-1.5">
        <SciFiButton
          variant="primary"
          size="sm"
          className="flex-1 gap-1 text-xs"
          onClick={launch}
        >
          <Wand2 className="h-3 w-3" />
          Start Creating
        </SciFiButton>
        <SciFiButton
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => navigate('/creative-journey')}
        >
          Full Studio <ArrowRight className="ml-1 h-3 w-3" />
        </SciFiButton>
      </div>
      {!user && (
        <p className="text-center text-[10px] text-muted-foreground">
          Sign in to start creating
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto bg-[#0A1A3D] text-white">
          <DialogHeader>
            <DialogTitle className="font-display text-[#5BCEFA]">
              Guided Creation
            </DialogTitle>
          </DialogHeader>
          <CreationJourney
            definition={generalCreateDefinition}
            generate={invokeGenerateImage}
            onComplete={() => {
              toast.success('Your creation is saved!');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
