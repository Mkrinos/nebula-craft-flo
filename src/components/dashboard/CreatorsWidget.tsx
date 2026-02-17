import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, UserCheck, Image as ImageIcon, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  images_count: number;
  is_following: boolean;
}

export function CreatorsWidget() {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, [user]);

  const fetchCreators = async () => {
    try {
      // Get profiles with their image counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .limit(20);

      if (!profiles) {
        setCreators([]);
        setLoading(false);
        return;
      }

      // Get image counts per user
      const { data: imageCounts } = await supabase
        .from('generated_images')
        .select('user_id')
        .eq('is_public', true);

      const imageCountMap = new Map<string, number>();
      (imageCounts || []).forEach(img => {
        imageCountMap.set(img.user_id, (imageCountMap.get(img.user_id) || 0) + 1);
      });

      // Check who current user is following
      let userFollowing = new Set<string>();
      if (user) {
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        userFollowing = new Set((followingData || []).map(f => f.following_id));
      }

      const creatorsData: Creator[] = profiles
        .filter(p => p.id !== user?.id && imageCountMap.get(p.id) && imageCountMap.get(p.id)! > 0)
        .map(p => ({
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          images_count: imageCountMap.get(p.id) || 0,
          is_following: userFollowing.has(p.id),
        }))
        .sort((a, b) => b.images_count - a.images_count)
        .slice(0, 4);

      setCreators(creatorsData);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (creator: Creator) => {
    if (!user) {
      toast.error('Sign in to follow creators');
      return;
    }

    haptic.trigger('selection');

    try {
      if (creator.is_following) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creator.id);
        toast.success(`Unfollowed ${creator.display_name || 'creator'}`);
      } else {
        await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: creator.id });
        toast.success(`Now following ${creator.display_name || 'creator'}!`);
      }

      // Update local state
      setCreators(prev => prev.map(c =>
        c.id === creator.id
          ? { ...c, is_following: !c.is_following }
          : c
      ));

      haptic.trigger('success');
    } catch (error) {
      console.error('Error toggling follow:', error);
      haptic.trigger('error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted/30" />
            <div className="flex-1">
              <div className="h-3 bg-muted/30 rounded w-20 mb-0.5" />
              <div className="h-2.5 bg-muted/20 rounded w-14" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="text-center py-4">
        <Sparkles className="w-6 h-6 mx-auto text-muted-foreground mb-1.5" />
        <p className="text-xs text-muted-foreground mb-2">Be the first to share creations!</p>
        <SciFiButton asChild variant="ghost" size="sm" className="h-6 text-xs">
          <Link to="/creative-journey">Start Creating</Link>
        </SciFiButton>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {creators.map((creator, index) => (
        <motion.div
          key={creator.id}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/20 transition-colors group"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Avatar className="w-8 h-8 border border-border/30">
            <AvatarImage src={creator.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {(creator.display_name || 'A').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate leading-tight">
              {creator.display_name || 'Anonymous'}
            </p>
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <ImageIcon className="w-2.5 h-2.5" />
              <span>{creator.images_count} creations</span>
            </div>
          </div>

          {user && (
            <motion.button
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') {
                  e.preventDefault();
                  handleFollow(creator);
                }
              }}
              onClick={(e) => {
                if (e.detail === 0) return; // Ignore synthetic clicks
                handleFollow(creator);
              }}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full transition-all active:scale-95 touch-manipulation flex items-center justify-center ${
                creator.is_following
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-muted/30 text-muted-foreground hover:bg-primary/20 hover:text-primary'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={creator.is_following ? `Unfollow ${creator.display_name}` : `Follow ${creator.display_name}`}
            >
              {creator.is_following ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </motion.div>
      ))}

      <Link
        to="/community"
        className="flex items-center justify-center gap-1 text-[10px] text-neon-cyan hover:underline pt-1"
      >
        Discover More Creators
        <ChevronRight className="w-2.5 h-2.5" />
      </Link>
    </div>
  );
}
