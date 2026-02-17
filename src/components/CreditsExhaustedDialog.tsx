import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { Zap, Rocket, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { motion } from 'framer-motion';

interface CreditsExhaustedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditsExhaustedDialog({ open, onOpenChange }: CreditsExhaustedDialogProps) {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();

  const handleUpgrade = () => {
    haptic.trigger('selection');
    onOpenChange(false);
    navigate('/billing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-neon-purple/30 bg-card/95 backdrop-blur-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 rounded-full bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center"
          >
            <Zap className="w-8 h-8 text-neon-purple" />
          </motion.div>
          
          <DialogTitle className="font-display text-xl text-foreground">
            Credits Exhausted
          </DialogTitle>
          
          <DialogDescription className="text-muted-foreground text-sm">
            You've used all your credits for this month. Upgrade your plan to continue creating amazing art!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
            <Sparkles className="w-5 h-5 text-neon-cyan flex-shrink-0" />
            <p className="text-sm text-foreground">Unlock unlimited creative potential</p>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
            <Rocket className="w-5 h-5 text-neon-purple flex-shrink-0" />
            <p className="text-sm text-foreground">Get HD quality & priority access</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <SciFiButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </SciFiButton>
          
          <SciFiButton
            variant="accent"
            shape="angled"
            onClick={handleUpgrade}
            className="w-full sm:w-auto gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade Now
          </SciFiButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
