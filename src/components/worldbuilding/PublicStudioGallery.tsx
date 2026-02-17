import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Heart, Eye, Sparkles, Users, Search, Filter,
  ChevronRight, Star, Trophy, MessageCircle, ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';

interface PublicStudio {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar?: string;
  studio_name: string;
  theme: string;
  background_style: string;
  likes_count: number;
  visits_count: number;
  decorations_count: number;
  has_liked: boolean;
  is_featured: boolean;
}

interface StudioViewerDialogProps {
  studio: PublicStudio | null;
  open: boolean;
  onClose: () => void;
  onLike: (studioId: string, ownerId: string) => Promise<void>;
  onVisit: (studioId: string, ownerId: string) => Promise<void>;
}

function StudioViewerDialog({ studio, open, onClose, onLike, onVisit }: StudioViewerDialogProps) {
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  const [comments, setComments] = useState<Array<{ id: string; content: string; user_name: string; created_at: string }>>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Record visit when dialog opens
  useEffect(() => {
    if (open && studio) {
      onVisit(studio.id, studio.owner_id);
    }
  }, [open, studio, onVisit]);

  // Fetch comments for this studio
  useEffect(() => {
    if (!studio) return;
    
    const fetchComments = async () => {
      const { data } = await supabase
        .from('studio_comments')
        .select('id, content, user_id, created_at')
        .eq('studio_id', studio.id)
        .eq('owner_id', studio.owner_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setComments(data.map(c => ({
          id: c.id,
          content: c.content,
          user_name: 'Explorer',
          created_at: c.created_at,
        })));
      }
    };
    
    fetchComments();
  }, [studio]);

  const handleSubmitComment = async () => {
    if (!studio || !user || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('studio_comments').insert({
        studio_id: studio.id,
        owner_id: studio.owner_id,
        user_id: user.id,
        content: newComment.trim(),
        is_child_friendly: true,
      });
      
      if (error) throw error;
      
      playSound('ding');
      trigger('success');
      setNewComment('');
      toast.success('Comment added!');
      
      // Refresh comments
      const { data } = await supabase
        .from('studio_comments')
        .select('id, content, user_id, created_at')
        .eq('studio_id', studio.id)
        .eq('owner_id', studio.owner_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setComments(data.map(c => ({
          id: c.id,
          content: c.content,
          user_name: 'Explorer',
          created_at: c.created_at,
        })));
      }
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!studio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg">{studio.studio_name}</p>
              <p className="text-sm text-muted-foreground font-normal">by {studio.owner_name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Studio Preview */}
        <div className={cn(
          "relative h-48 rounded-xl overflow-hidden",
          "bg-gradient-to-br from-primary/20 via-violet-500/20 to-cyan-500/20"
        )}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-primary/40" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <Badge variant="outline" className="bg-background/80">
              {studio.theme}
            </Badge>
            {studio.is_featured && (
              <Badge className="bg-amber-500/80 gap-1">
                <Trophy className="w-3 h-3" />
                Featured
              </Badge>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6 py-4">
          <motion.button
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-colors touch-manipulation min-h-[44px]",
              studio.has_liked ? "bg-rose-500/20 text-rose-400" : "bg-muted hover:bg-muted/80"
            )}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => {
              if (e.pointerType === "touch") {
                e.preventDefault();
                onLike(studio.id, studio.owner_id);
              }
            }}
            onClick={(e) => {
              if (e.detail === 0) return;
              onLike(studio.id, studio.owner_id);
            }}
          >
            <Heart className={cn("w-5 h-5 pointer-events-none", studio.has_liked && "fill-current")} />
            <span className="font-medium">{studio.likes_count}</span>
          </motion.button>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-5 h-5" />
            <span>{studio.visits_count} visits</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{studio.decorations_count} decorations</span>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments.length})
          </h4>
          
          {user && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Leave a nice comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={200}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                Send
              </Button>
            </div>
          )}
          
          <ScrollArea className="h-[150px]">
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No comments yet. Be the first!
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SortOption = 'popular' | 'recent' | 'visits' | 'decorations';
type FilterOption = 'all' | 'featured' | 'following';

export function PublicStudioGallery() {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [studios, setStudios] = useState<PublicStudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedStudio, setSelectedStudio] = useState<PublicStudio | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Fetch public studios with aggregated data
  const fetchStudios = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all studios with their owners' info
      const { data: studiosData, error: studiosError } = await supabase
        .from('user_studios')
        .select(`
          studio_id,
          user_id,
          is_active,
          studio_spaces!inner (
            id,
            name,
            theme,
            background_style
          )
        `)
        .eq('is_active', true)
        .limit(50);
      
      if (studiosError) throw studiosError;
      
      // Get profiles for owner names
      const ownerIds = [...new Set(studiosData?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', ownerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Get likes count per studio
      const { data: likesData } = await supabase
        .from('studio_likes')
        .select('studio_id, owner_id');
      
      // Get visits count per studio
      const { data: visitsData } = await supabase
        .from('studio_visits')
        .select('studio_id, owner_id');
      
      // Get decorations count per studio
      const { data: decorationsData } = await supabase
        .from('user_studio_placements')
        .select('studio_id, user_id');
      
      // Get user's likes
      const userLikes = new Set<string>();
      if (user) {
        const { data: myLikes } = await supabase
          .from('studio_likes')
          .select('studio_id, owner_id')
          .eq('user_id', user.id);
        
        myLikes?.forEach(l => userLikes.add(`${l.studio_id}-${l.owner_id}`));
      }
      
      // Aggregate data
      const aggregatedStudios: PublicStudio[] = (studiosData || []).map(s => {
        const studioSpace = s.studio_spaces as unknown as { id: string; name: string; theme: string; background_style: string };
        const profile = profileMap.get(s.user_id);
        const likes = likesData?.filter(l => l.studio_id === s.studio_id && l.owner_id === s.user_id).length || 0;
        const visits = visitsData?.filter(v => v.studio_id === s.studio_id && v.owner_id === s.user_id).length || 0;
        const decorations = decorationsData?.filter(d => d.studio_id === s.studio_id && d.user_id === s.user_id).length || 0;
        
        return {
          id: s.studio_id,
          owner_id: s.user_id,
          owner_name: profile?.display_name || 'Explorer',
          owner_avatar: profile?.avatar_url || undefined,
          studio_name: studioSpace.name,
          theme: studioSpace.theme,
          background_style: studioSpace.background_style,
          likes_count: likes,
          visits_count: visits,
          decorations_count: decorations,
          has_liked: userLikes.has(`${s.studio_id}-${s.user_id}`),
          is_featured: likes >= 10,
        };
      }).filter(s => s.owner_id !== user?.id); // Don't show own studio
      
      setStudios(aggregatedStudios);
    } catch (error) {
      console.error('Error fetching studios:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudios();
  }, [fetchStudios]);

  // Filtered and sorted studios
  const filteredStudios = useMemo(() => {
    let result = [...studios];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.owner_name.toLowerCase().includes(query) ||
        s.studio_name.toLowerCase().includes(query) ||
        s.theme.toLowerCase().includes(query)
      );
    }
    
    // Type filter
    if (filterBy === 'featured') {
      result = result.filter(s => s.is_featured);
    }
    
    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'recent':
        // By visits as proxy for recent activity
        result.sort((a, b) => b.visits_count - a.visits_count);
        break;
      case 'visits':
        result.sort((a, b) => b.visits_count - a.visits_count);
        break;
      case 'decorations':
        result.sort((a, b) => b.decorations_count - a.decorations_count);
        break;
    }
    
    return result;
  }, [studios, searchQuery, sortBy, filterBy]);

  // Handle like
  const handleLike = useCallback(async (studioId: string, ownerId: string) => {
    if (!user) {
      toast.error('Sign in to like studios');
      return;
    }
    
    const studio = studios.find(s => s.id === studioId && s.owner_id === ownerId);
    if (!studio) return;
    
    try {
      if (studio.has_liked) {
        await supabase
          .from('studio_likes')
          .delete()
          .eq('studio_id', studioId)
          .eq('owner_id', ownerId)
          .eq('user_id', user.id);
        
        playSound('pop');
        trigger('light');
      } else {
        await supabase.from('studio_likes').insert({
          studio_id: studioId,
          owner_id: ownerId,
          user_id: user.id,
        });
        
        playSound('achievement');
        trigger('success');
      }
      
      // Update local state
      setStudios(prev => prev.map(s => {
        if (s.id === studioId && s.owner_id === ownerId) {
          return {
            ...s,
            has_liked: !s.has_liked,
            likes_count: s.has_liked ? s.likes_count - 1 : s.likes_count + 1,
          };
        }
        return s;
      }));
      
      // Update selected studio if open
      if (selectedStudio?.id === studioId) {
        setSelectedStudio(prev => prev ? {
          ...prev,
          has_liked: !prev.has_liked,
          likes_count: prev.has_liked ? prev.likes_count - 1 : prev.likes_count + 1,
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user, studios, selectedStudio, playSound, trigger]);

  // Handle visit
  const handleVisit = useCallback(async (studioId: string, ownerId: string) => {
    if (!user || user.id === ownerId) return;
    
    try {
      await supabase.rpc('record_studio_visit', {
        p_visitor_id: user.id,
        p_owner_id: ownerId,
        p_studio_id: studioId,
      });
      
      // Update visit count locally
      setStudios(prev => prev.map(s => {
        if (s.id === studioId && s.owner_id === ownerId) {
          return { ...s, visits_count: s.visits_count + 1 };
        }
        return s;
      }));
    } catch {
      // Visit may fail if already visited today, that's ok
    }
  }, [user]);

  // Open studio viewer
  const openStudioViewer = (studio: PublicStudio) => {
    setSelectedStudio(studio);
    setShowViewer(true);
    trigger('selection');
    playSound('ding');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Globe className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Public Studio Gallery</h2>
        <Badge variant="secondary" className="ml-auto">
          {filteredStudios.length} studios
        </Badge>
      </motion.div>
      
      {/* Search & Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search studios, owners, themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Liked</SelectItem>
            <SelectItem value="visits">Most Visited</SelectItem>
            <SelectItem value="decorations">Most Decorated</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
          <SelectTrigger className="w-[120px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
      
      {/* Featured Studios Carousel */}
      {filteredStudios.some(s => s.is_featured) && filterBy !== 'featured' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">Featured Studios</h3>
          </div>
          <ScrollArea className="w-full pb-4">
            <div className="flex gap-4">
              {filteredStudios.filter(s => s.is_featured).slice(0, 5).map((studio) => (
                <motion.div
                  key={`${studio.id}-${studio.owner_id}`}
                  className="w-[280px] flex-shrink-0 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openStudioViewer(studio)}
                >
                  <SciFiFrame glowIntensity="medium" className="p-4 h-full bg-gradient-to-br from-amber-500/10 to-transparent">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 border-2 border-amber-500/30">
                        <AvatarImage src={studio.owner_avatar} />
                        <AvatarFallback>{studio.owner_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{studio.owner_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{studio.studio_name}</p>
                      </div>
                      <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-400" />
                        {studio.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {studio.visits_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        {studio.decorations_count}
                      </span>
                    </div>
                  </SciFiFrame>
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>
      )}
      
      {/* Studios Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : filteredStudios.length === 0 ? (
        <SciFiFrame className="p-12 text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No studios found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </SciFiFrame>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredStudios.map((studio, index) => (
              <motion.div
                key={`${studio.id}-${studio.owner_id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                onClick={() => openStudioViewer(studio)}
              >
                <SciFiFrame glowIntensity="subtle" className="p-4 h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={studio.owner_avatar} />
                      <AvatarFallback className="text-xs">
                        {studio.owner_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{studio.owner_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{studio.studio_name}</p>
                    </div>
                    {studio.is_featured && (
                      <Trophy className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  
                  {/* Preview */}
                  <div className={cn(
                    "h-24 rounded-lg mb-3 flex items-center justify-center",
                    "bg-gradient-to-br from-primary/10 to-violet-500/10"
                  )}>
                    <Star className="w-8 h-8 text-primary/30" />
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className={cn(
                          "w-4 h-4",
                          studio.has_liked && "text-rose-400 fill-current"
                        )} />
                        {studio.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {studio.visits_count}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudioViewer(studio);
                      }}
                    >
                      Visit
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </SciFiFrame>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Studio Viewer Dialog */}
      <StudioViewerDialog
        studio={selectedStudio}
        open={showViewer}
        onClose={() => setShowViewer(false)}
        onLike={handleLike}
        onVisit={handleVisit}
      />
    </div>
  );
}
