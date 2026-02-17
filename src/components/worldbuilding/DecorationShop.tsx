import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Sparkles, Coins, Lock, Check, 
  Filter, ChevronDown, Star, Zap, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { StudioDecoration } from '@/hooks/useStudioSpaces';

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  common: { 
    bg: 'bg-slate-500/20', 
    border: 'border-slate-400/40',
    glow: '',
    text: 'text-slate-400',
  },
  rare: { 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-400/60',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    text: 'text-blue-400',
  },
  epic: { 
    bg: 'bg-violet-500/20', 
    border: 'border-violet-400/60',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
    text: 'text-violet-400',
  },
  legendary: { 
    bg: 'bg-amber-500/20', 
    border: 'border-amber-400/60',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.5)]',
    text: 'text-amber-400',
  },
};

interface DecorationShopProps {
  decorations: StudioDecoration[];
  creditsRemaining: number;
  isDecorationUnlocked: (id: string) => boolean;
  onPurchase: (decorationId: string, cost: number) => Promise<{ success: boolean }>;
}

export function DecorationShop({
  decorations,
  creditsRemaining,
  isDecorationUnlocked,
  onPurchase,
}: DecorationShopProps) {
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [filter, setFilter] = useState<'all' | 'affordable' | 'rare' | 'epic' | 'legendary'>('all');
  const [purchaseDialog, setPurchaseDialog] = useState<StudioDecoration | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [justPurchased, setJustPurchased] = useState<string | null>(null);

  // Filter only purchasable decorations (credits unlock method)
  const shopItems = decorations.filter(d => 
    d.unlock_method === 'credits' && d.credits_cost > 0 && !isDecorationUnlocked(d.id)
  );

  const filteredItems = shopItems.filter(d => {
    if (filter === 'affordable') return d.credits_cost <= creditsRemaining;
    if (filter === 'rare') return d.rarity === 'rare';
    if (filter === 'epic') return d.rarity === 'epic';
    if (filter === 'legendary') return d.rarity === 'legendary';
    return true;
  });

  const handlePurchase = async () => {
    if (!purchaseDialog) return;
    
    setIsPurchasing(true);
    try {
      const result = await onPurchase(purchaseDialog.id, purchaseDialog.credits_cost);
      if (result.success) {
        playSound('achievement');
        trigger('success');
        setJustPurchased(purchaseDialog.id);
        setTimeout(() => setJustPurchased(null), 3000);
      }
    } finally {
      setIsPurchasing(false);
      setPurchaseDialog(null);
    }
  };

  const openPurchaseDialog = (decoration: StudioDecoration) => {
    playSound('ding');
    trigger('selection');
    setPurchaseDialog(decoration);
  };

  return (
    <motion.div
      className="relative rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-background p-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-xl bg-primary/20"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ShoppingBag className="w-6 h-6 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Decoration Shop
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {shopItems.length} items available
            </p>
          </div>
        </div>
        
        {/* Credits display */}
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40"
          whileHover={{ scale: 1.05 }}
        >
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-amber-400">{creditsRemaining}</span>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="relative flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TouchTriggerButton className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
              <Filter className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">{filter === 'all' ? 'All Items' : filter === 'affordable' ? 'Affordable' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Only`}</span>
              <ChevronDown className="w-3 h-3 pointer-events-none" />
            </TouchTriggerButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter('all')}>All Items</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('affordable')}>
              <Coins className="w-4 h-4 mr-2" />
              Affordable
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('rare')}>
              <span className="text-blue-400 mr-2">★</span>
              Rare Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('epic')}>
              <span className="text-violet-400 mr-2">★</span>
              Epic Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('legendary')}>
              <span className="text-amber-400 mr-2">★</span>
              Legendary Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Badge variant="secondary" className="ml-auto">
          {filteredItems.length} results
        </Badge>
      </div>

      {/* Shop Grid */}
      <ScrollArea className="h-[300px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Gift className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'affordable' 
                ? "No items available at your credit level"
                : "No items match your filter"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((decoration, index) => {
                const rarityStyle = RARITY_STYLES[decoration.rarity] || RARITY_STYLES.common;
                const canAfford = creditsRemaining >= decoration.credits_cost;
                const wasJustPurchased = justPurchased === decoration.id;

                return (
                  <motion.div
                    key={decoration.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: wasJustPurchased ? 0 : 1, 
                      scale: wasJustPurchased ? 1.2 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative rounded-xl border-2 p-4 cursor-pointer transition-all touch-manipulation min-h-[100px]",
                      rarityStyle.bg,
                      rarityStyle.border,
                      canAfford ? rarityStyle.glow : "opacity-60",
                    )}
                    whileHover={canAfford ? { scale: 1.05, y: -4 } : undefined}
                    whileTap={canAfford ? { scale: 0.95 } : undefined}
                    onPointerDown={(e) => {
                      if (e.pointerType === "touch" && canAfford) {
                        e.preventDefault();
                        openPurchaseDialog(decoration);
                      }
                    }}
                    onClick={(e) => {
                      if (e.detail === 0) return;
                      canAfford && openPurchaseDialog(decoration);
                    }}
                  >
                    {/* Legendary shimmer */}
                    {decoration.rarity === 'legendary' && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)',
                        }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    )}
                    
                    {/* Cannot afford overlay */}
                    {!canAfford && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-xl">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Icon */}
                    <motion.div
                      className="text-center mb-3"
                      animate={decoration.rarity !== 'common' ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      } : undefined}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <span className="text-4xl">{decoration.icon}</span>
                    </motion.div>

                    {/* Name */}
                    <h4 className="text-sm font-semibold text-center truncate mb-1">
                      {decoration.name}
                    </h4>

                    {/* Rarity */}
                    <div className={cn(
                      "text-[10px] text-center uppercase tracking-wider mb-2",
                      rarityStyle.text
                    )}>
                      {decoration.rarity}
                    </div>

                    {/* Price */}
                    <div className={cn(
                      "flex items-center justify-center gap-1 text-sm font-bold",
                      canAfford ? "text-amber-400" : "text-muted-foreground"
                    )}>
                      <Coins className="w-4 h-4" />
                      {decoration.credits_cost}
                    </div>

                    {/* Sparkle for high rarity */}
                    {(decoration.rarity === 'epic' || decoration.rarity === 'legendary') && (
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Star className={cn(
                          "w-4 h-4",
                          decoration.rarity === 'legendary' ? "text-amber-400" : "text-violet-400"
                        )} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Purchase Dialog */}
      <Dialog open={!!purchaseDialog} onOpenChange={() => setPurchaseDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {purchaseDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-3xl">{purchaseDialog.icon}</span>
                  {purchaseDialog.name}
                </DialogTitle>
                <DialogDescription>
                  {purchaseDialog.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center gap-4 py-6">
                <motion.div
                  className={cn(
                    "text-6xl p-6 rounded-2xl",
                    RARITY_STYLES[purchaseDialog.rarity]?.bg,
                    RARITY_STYLES[purchaseDialog.rarity]?.glow
                  )}
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {purchaseDialog.icon}
                </motion.div>
                
                <Badge className={cn(
                  "text-sm",
                  RARITY_STYLES[purchaseDialog.rarity]?.text
                )}>
                  {purchaseDialog.rarity.charAt(0).toUpperCase() + purchaseDialog.rarity.slice(1)}
                </Badge>
                
                <div className="flex items-center gap-2 text-2xl font-bold text-amber-400">
                  <Coins className="w-6 h-6" />
                  {purchaseDialog.credits_cost} Credits
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  You have <span className="text-amber-400 font-bold">{creditsRemaining}</span> credits remaining
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setPurchaseDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing || creditsRemaining < purchaseDialog.credits_cost}
                  className="gap-2"
                >
                  {isPurchasing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                      Purchasing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Purchase
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
