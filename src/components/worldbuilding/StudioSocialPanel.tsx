import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Link, Copy, Check, Users, Heart, 
  MessageCircle, Eye, Trophy, Star, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { StudioSpace } from '@/hooks/useStudioSpaces';

interface StudioSocialPanelProps {
  activeStudio: StudioSpace | null;
  placementsCount: number;
  totalDecorations: number;
}

// Mock data for social features
const MOCK_VISITORS = [
  { id: '1', name: 'StarGazer42', avatar: null, visitedAt: '2 hours ago', liked: true },
  { id: '2', name: 'CosmicArtist', avatar: null, visitedAt: '5 hours ago', liked: true },
  { id: '3', name: 'DreamWeaver', avatar: null, visitedAt: 'Yesterday', liked: false },
  { id: '4', name: 'PixelMaster', avatar: null, visitedAt: '2 days ago', liked: true },
];

const MOCK_FEATURED_STUDIOS = [
  { id: '1', owner: 'GalacticAce', theme: 'Cosmic Observatory', likes: 142, decorations: 15 },
  { id: '2', owner: 'NeonDreamer', theme: 'Neon City', likes: 98, decorations: 12 },
  { id: '3', owner: 'ForestSpirit', theme: 'Enchanted Forest', likes: 87, decorations: 18 },
];

export function StudioSocialPanel({
  activeStudio,
  placementsCount,
  totalDecorations,
}: StudioSocialPanelProps) {
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(23);
  const [hasLiked, setHasLiked] = useState(false);
  const [views] = useState(156);

  const shareUrl = `https://mx2k.app/studio/${activeStudio?.id || 'demo'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    playSound('ding');
    trigger('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setHasLiked(!hasLiked);
    setLikes(prev => hasLiked ? prev - 1 : prev + 1);
    playSound(hasLiked ? 'pop' : 'achievement');
    trigger(hasLiked ? 'light' : 'success');
  };

  const handleShare = (platform: 'twitter' | 'discord' | 'copy') => {
    trigger('selection');
    playSound('ding');
    
    if (platform === 'copy') {
      handleCopyLink();
    } else if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=Check out my creative studio!&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
      );
    } else if (platform === 'discord') {
      navigator.clipboard.writeText(`Check out my creative studio! ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <motion.div
        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-6">
          {/* Views */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Eye className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold">{views}</span>
            <span className="text-sm text-muted-foreground">views</span>
          </motion.div>
          
          {/* Likes */}
          <motion.button
            className={cn(
              "flex items-center gap-2 transition-colors min-h-[44px] px-2 touch-manipulation",
              hasLiked && "text-rose-400"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => {
              if (e.pointerType === "touch") {
                e.preventDefault();
                handleLike();
              }
            }}
            onClick={(e) => {
              if (e.detail === 0) return; // Skip if triggered by touch
              handleLike();
            }}
          >
            <motion.div
              animate={hasLiked ? { scale: [1, 1.3, 1] } : undefined}
            >
              <Heart className={cn("w-5 h-5 pointer-events-none", hasLiked && "fill-current")} />
            </motion.div>
            <span className="font-bold">{likes}</span>
            <span className="text-sm text-muted-foreground">likes</span>
          </motion.button>
          
          {/* Decorations */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-bold">{placementsCount}</span>
            <span className="text-sm text-muted-foreground">decorations placed</span>
          </div>
        </div>
        
        {/* Share Button */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowShareDialog(true)}
        >
          <Share2 className="w-4 h-4" />
          Share Studio
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Visitors */}
        <motion.div
          className="rounded-xl border bg-card/50 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Recent Visitors</h3>
            <Badge variant="secondary" className="ml-auto">
              {MOCK_VISITORS.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {MOCK_VISITORS.map((visitor, index) => (
                <motion.div
                  key={visitor.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={visitor.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {visitor.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{visitor.name}</p>
                    <p className="text-xs text-muted-foreground">{visitor.visitedAt}</p>
                  </div>
                  {visitor.liked && (
                    <Heart className="w-4 h-4 text-rose-400 fill-current" />
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Featured Studios */}
        <motion.div
          className="rounded-xl border bg-card/50 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">Featured Studios</h3>
            <Badge variant="secondary" className="ml-auto bg-amber-500/20 text-amber-400">
              Top 3
            </Badge>
          </div>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {MOCK_FEATURED_STUDIOS.map((studio, index) => (
                <motion.div
                  key={studio.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 cursor-pointer hover:from-amber-500/20 transition-all"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 && "bg-amber-500/30 text-amber-400",
                    index === 1 && "bg-slate-400/30 text-slate-300",
                    index === 2 && "bg-amber-700/30 text-amber-600",
                  )}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{studio.owner}</p>
                    <p className="text-xs text-muted-foreground">{studio.theme}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      {studio.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {studio.decorations}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          
          <Button variant="ghost" className="w-full mt-3 text-sm">
            View All Studios
          </Button>
        </motion.div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Studio
            </DialogTitle>
            <DialogDescription>
              Invite friends to visit your creative space!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Link input */}
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="min-h-[44px] min-w-[44px]"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
            
            {/* Share buttons */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare('twitter')}
              >
                <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Twitter</span>
              </motion.button>
              
              <motion.button
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare('discord')}
              >
                <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#5865F2]" />
                </div>
                <span className="text-sm font-medium">Discord</span>
              </motion.button>
              
              <motion.button
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShare('copy')}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Link className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Copy Link</span>
              </motion.button>
            </div>
            
            {/* Studio preview */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{activeStudio?.name || 'My Studio'}</p>
                  <p className="text-sm text-muted-foreground">
                    {placementsCount} decorations • {likes} likes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
