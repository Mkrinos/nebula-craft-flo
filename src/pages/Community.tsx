import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSignedImageUrls } from '@/hooks/useSignedImageUrl';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import { PullToRefresh } from '@/components/PullToRefresh';
import StarfieldBackground from '@/components/StarfieldBackground';
import { ImageComments } from '@/components/ImageComments';
import { SEOHead } from '@/components/SEOHead';
import { CommunityTour } from '@/components/community/CommunityTour';
import { ContributorBadgesDisplay } from '@/components/community/ContributorBadgesDisplay';
import { ContributorBadgesPanel } from '@/components/community/ContributorBadgesPanel';
import { BadgeLeaderboard } from '@/components/community/BadgeLeaderboard';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { SciFiCard, SciFiCardContent } from '@/components/ui/sci-fi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  UserPlus, 
  UserCheck,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
  Globe,
  X,
  Award
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';

interface CommunityImage {
  id: string;
  user_id: string;
  prompt: string;
  style: string | null;
  image_url: string;
  created_at: string;
  is_public: boolean;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  images_count: number;
  followers_count: number;
  is_following: boolean;
}

const Community = () => {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [activeTab, setActiveTab] = useState('gallery');
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [followingFeed, setFollowingFeed] = useState<CommunityImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<CommunityImage | null>(null);
  const [tourHighlight, setTourHighlight] = useState<string | null>(null);

  // Get signed URLs for all images
  const allImageUrls = useMemo(() => {
    const urls = images.map(img => img.image_url);
    followingFeed.forEach(img => {
      if (!urls.includes(img.image_url)) urls.push(img.image_url);
    });
    return urls;
  }, [images, followingFeed]);
  const { getSignedUrl } = useSignedImageUrls(allImageUrls);

  const handleTourHighlight = useCallback((elementId: string | null) => {
    setTourHighlight(elementId);
  }, []);

  useEffect(() => {
    fetchCommunityData();
  }, [user]);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      // Fetch public images
      const { data: imagesData, error: imagesError } = await supabase
        .from('generated_images')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (imagesError) throw imagesError;

      // Fetch profiles for images
      const userIds = [...new Set((imagesData || []).map(img => img.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch likes counts
      const imageIds = (imagesData || []).map(img => img.id);
      const { data: likesData } = await supabase
        .from('image_likes')
        .select('image_id')
        .in('image_id', imageIds);

      const likesCountMap = new Map<string, number>();
      (likesData || []).forEach(like => {
        likesCountMap.set(like.image_id, (likesCountMap.get(like.image_id) || 0) + 1);
      });

      // Check which images user has liked
      let userLikes = new Set<string>();
      if (user) {
        const { data: userLikesData } = await supabase
          .from('image_likes')
          .select('image_id')
          .eq('user_id', user.id)
          .in('image_id', imageIds);
        userLikes = new Set((userLikesData || []).map(l => l.image_id));
      }

      // Fetch comments counts
      const { data: commentsData } = await supabase
        .from('image_comments')
        .select('image_id')
        .in('image_id', imageIds);

      const commentsCountMap = new Map<string, number>();
      (commentsData || []).forEach(comment => {
        commentsCountMap.set(comment.image_id, (commentsCountMap.get(comment.image_id) || 0) + 1);
      });

      const enrichedImages: CommunityImage[] = (imagesData || []).map(img => ({
        ...img,
        profiles: profileMap.get(img.user_id) || { id: img.user_id, display_name: null, avatar_url: null },
        likes_count: likesCountMap.get(img.id) || 0,
        comments_count: commentsCountMap.get(img.id) || 0,
        is_liked: userLikes.has(img.id)
      }));

      setImages(enrichedImages);

      // Fetch top creators
      await fetchCreators();

      // Fetch following feed if logged in
      if (user) {
        await fetchFollowingFeed();
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      toast.error('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      // Get profiles with their image counts
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .limit(20);

      if (!profilesData) return;

      // Get image counts per user
      const { data: imageCounts } = await supabase
        .from('generated_images')
        .select('user_id')
        .eq('is_public', true);

      const imageCountMap = new Map<string, number>();
      (imageCounts || []).forEach(img => {
        imageCountMap.set(img.user_id, (imageCountMap.get(img.user_id) || 0) + 1);
      });

      // Get follower counts
      const { data: followerCounts } = await supabase
        .from('user_follows')
        .select('following_id');

      const followerCountMap = new Map<string, number>();
      (followerCounts || []).forEach(f => {
        followerCountMap.set(f.following_id, (followerCountMap.get(f.following_id) || 0) + 1);
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

      const creatorsData: Creator[] = profilesData
        .filter(p => imageCountMap.get(p.id) && imageCountMap.get(p.id)! > 0)
        .map(p => ({
          ...p,
          images_count: imageCountMap.get(p.id) || 0,
          followers_count: followerCountMap.get(p.id) || 0,
          is_following: userFollowing.has(p.id)
        }))
        .sort((a, b) => b.images_count - a.images_count)
        .slice(0, 10);

      setCreators(creatorsData);
    } catch (error) {
      console.error('Error fetching creators:', error);
    }
  };

  const fetchFollowingFeed = async () => {
    if (!user) return;

    try {
      // Get who user is following
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!following || following.length === 0) {
        setFollowingFeed([]);
        return;
      }

      const followingIds = following.map(f => f.following_id);

      // Get images from followed users
      const { data: feedImages } = await supabase
        .from('generated_images')
        .select('*')
        .eq('is_public', true)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!feedImages) {
        setFollowingFeed([]);
        return;
      }

      // Enrich with profile data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', followingIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedFeed: CommunityImage[] = feedImages.map(img => ({
        ...img,
        profiles: profileMap.get(img.user_id) || { id: img.user_id, display_name: null, avatar_url: null },
        likes_count: 0,
        comments_count: 0,
        is_liked: false
      }));

      setFollowingFeed(enrichedFeed);
    } catch (error) {
      console.error('Error fetching following feed:', error);
    }
  };

  const handleLike = async (image: CommunityImage) => {
    if (!user) {
      toast.error('Please sign in to like images');
      return;
    }

    haptic.trigger('selection');

    try {
      if (image.is_liked) {
        await supabase
          .from('image_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('image_id', image.id);
      } else {
        await supabase
          .from('image_likes')
          .insert({ user_id: user.id, image_id: image.id });
      }

      // Update local state
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, is_liked: !img.is_liked, likes_count: img.likes_count + (img.is_liked ? -1 : 1) }
          : img
      ));

      haptic.trigger('success');
    } catch (error) {
      console.error('Error toggling like:', error);
      haptic.trigger('error');
    }
  };

  const handleFollow = async (creator: Creator) => {
    if (!user) {
      toast.error('Please sign in to follow creators');
      return;
    }

    if (creator.id === user.id) {
      toast.error("You can't follow yourself!");
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
          ? { ...c, is_following: !c.is_following, followers_count: c.followers_count + (c.is_following ? -1 : 1) }
          : c
      ));

      haptic.trigger('success');
    } catch (error) {
      console.error('Error toggling follow:', error);
      haptic.trigger('error');
    }
  };

  const handleShare = async (image: CommunityImage) => {
    haptic.trigger('selection');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${image.profiles?.display_name || 'Creator'}'s NexusTouch Creation`,
          text: image.prompt,
          url: image.image_url
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(image.image_url);
          toast.success('Link copied!');
        }
      }
    } else {
      navigator.clipboard.writeText(image.image_url);
      toast.success('Link copied!');
    }
  };

  const ImageCard = ({ image }: { image: CommunityImage }) => {
    let cardTouched = false;
    let likeTouched = false;
    let shareTouched = false;
    
    return (
      <div 
        className="group relative aspect-square rounded-lg overflow-hidden border border-border/30 hover:border-neon-cyan/50 active:scale-[0.98] transition-all cursor-pointer bg-space-dark touch-manipulation"
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') {
            cardTouched = true;
            haptic.trigger('light');
            setSelectedImage(image);
          }
        }}
        onClick={() => {
          if (cardTouched) {
            cardTouched = false;
            return;
          }
          setSelectedImage(image);
        }}
      >
        <img
          src={getSignedUrl(image.image_url)}
          alt={image.prompt}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 md:transition-opacity pointer-events-none md:pointer-events-auto">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-xs text-foreground line-clamp-2 mb-2">{image.prompt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
                  {image.profiles?.avatar_url ? (
                    <img src={image.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-3 h-3 text-neon-cyan" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {image.profiles?.display_name || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center gap-1 pointer-events-auto">
                <button 
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.stopPropagation();
                      likeTouched = true;
                      haptic.trigger('selection');
                      handleLike(image);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (likeTouched) {
                      likeTouched = false;
                      return;
                    }
                    handleLike(image);
                  }}
                  className="flex items-center gap-0.5 text-xs p-2 min-w-[44px] min-h-[44px] touch-manipulation active:scale-90 rounded-lg hover:bg-muted/30"
                  aria-label={image.is_liked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`w-4 h-4 ${image.is_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  <span className="text-muted-foreground">{image.likes_count}</span>
                </button>
                <button 
                  onPointerDown={(e) => {
                    if (e.pointerType === 'touch') {
                      e.stopPropagation();
                      shareTouched = true;
                      haptic.trigger('light');
                      handleShare(image);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (shareTouched) {
                      shareTouched = false;
                      return;
                    }
                    handleShare(image);
                  }}
                  className="text-muted-foreground hover:text-neon-cyan p-2 min-w-[44px] min-h-[44px] touch-manipulation active:scale-90 rounded-lg hover:bg-muted/30"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SwipeablePageWrapper>
      <PullToRefresh onRefresh={fetchCommunityData}>
        <div className="min-h-screen relative">
        <SEOHead 
          title="Community Gallery - Share AI Creations"
          description="Discover and share amazing AI-generated art with fellow creators. Like, comment, and follow your favorite artists in the NexusTouch community."
        />
        <StarfieldBackground />
        <Navigation />

        <CommunityTour onHighlight={handleTourHighlight} />

        <main className="relative z-10 pt-16 sm:pt-20 md:pt-24 pb-24 md:pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <BackButton />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                    <Globe className="w-7 h-7 text-neon-cyan" />
                    Community Gallery
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Discover and share amazing creations with fellow explorers
                  </p>
                </div>
                <Link to="/ai-ecosystem">
                  <SciFiButton variant="ghost" className="gap-2 shrink-0">
                    <Sparkles className="w-4 h-4" />
                    Explore AI Platforms
                  </SciFiButton>
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-space-dark/50 border border-border/30">
                <TabsTrigger 
                  value="gallery" 
                  className={cn(
                    "gap-2 data-[state=active]:bg-neon-cyan/20",
                    tourHighlight === 'discover-tab' && "ring-2 ring-neon-cyan ring-offset-2 ring-offset-background animate-pulse"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Discover
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className={cn(
                    "gap-2 data-[state=active]:bg-neon-cyan/20",
                    tourHighlight === 'following-tab' && "ring-2 ring-neon-cyan ring-offset-2 ring-offset-background animate-pulse"
                  )}
                >
                  <Users className="w-4 h-4" />
                  Following
                </TabsTrigger>
                <TabsTrigger 
                  value="creators" 
                  className={cn(
                    "gap-2 data-[state=active]:bg-neon-cyan/20",
                    tourHighlight === 'creators-tab' && "ring-2 ring-neon-cyan ring-offset-2 ring-offset-background animate-pulse"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Creators
                </TabsTrigger>
                <TabsTrigger 
                  value="badges" 
                  className="gap-2 data-[state=active]:bg-neon-cyan/20"
                >
                  <Award className="w-4 h-4" />
                  Badges
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                  </div>
                ) : images.length === 0 ? (
                  <SciFiFrame className="p-12 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No public creations yet</p>
                    <Link to="/creative-journey">
                      <SciFiButton variant="primary">Be the first to share!</SciFiButton>
                    </Link>
                  </SciFiFrame>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {images.map(image => (
                      <ImageCard key={image.id} image={image} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="following">
                {!user ? (
                  <SciFiFrame className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Sign in to see your feed</p>
                    <Link to="/auth">
                      <SciFiButton variant="primary">Sign In</SciFiButton>
                    </Link>
                  </SciFiFrame>
                ) : followingFeed.length === 0 ? (
                  <SciFiFrame className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Follow some creators to see their work here!</p>
                    <SciFiButton variant="ghost" onClick={() => setActiveTab('creators')}>
                      Discover Creators
                    </SciFiButton>
                  </SciFiFrame>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {followingFeed.map(image => (
                      <ImageCard key={image.id} image={image} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="creators">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creators.map(creator => (
                    <SciFiCard key={creator.id} className="p-4">
                      <SciFiCardContent className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                          {creator.avatar_url ? (
                            <img src={creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-neon-cyan" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-display font-semibold text-foreground truncate">
                              {creator.display_name || 'Anonymous Creator'}
                            </p>
                            <ContributorBadgesDisplay userId={creator.id} maxDisplay={2} size="sm" />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {creator.images_count} creations
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {creator.followers_count} followers
                            </span>
                          </div>
                        </div>
                        {user && creator.id !== user.id && (
                          <SciFiButton
                            variant={creator.is_following ? 'ghost' : 'primary'}
                            size="sm"
                            onClick={() => handleFollow(creator)}
                          >
                            {creator.is_following ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                          </SciFiButton>
                        )}
                      </SciFiCardContent>
                    </SciFiCard>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="badges">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BadgeLeaderboard />
                  <ContributorBadgesPanel />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Image Detail Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <SciFiFrame 
              className="max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
                    {selectedImage.profiles?.avatar_url ? (
                      <img src={selectedImage.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-neon-cyan" />
                    )}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">
                      {selectedImage.profiles?.display_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedImage.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <SciFiButton variant="ghost" size="sm" onClick={() => setSelectedImage(null)}>
                  <X className="w-5 h-5" />
                </SciFiButton>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-lg overflow-hidden border border-neon-cyan/30">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-contain bg-space-dark"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Prompt</p>
                    <p className="text-foreground">{selectedImage.prompt}</p>
                  </div>

                  {selectedImage.style && (
                    <div>
                      <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Style</p>
                      <SciFiBadge variant="default">{selectedImage.style}</SciFiBadge>
                    </div>
                  )}

                  <div className="flex items-center gap-4 py-4 border-t border-b border-border/30">
                    <button 
                      onClick={() => handleLike(selectedImage)}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`w-5 h-5 ${selectedImage.is_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                      <span className="text-foreground">{selectedImage.likes_count} likes</span>
                    </button>
                    <button 
                      onClick={() => handleShare(selectedImage)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-neon-cyan"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* AI-Moderated Comments */}
                  <ImageComments imageId={selectedImage.id} />
                </div>
              </div>
            </SciFiFrame>
          </div>
        )}

        <MobileBottomNav />
      </div>
      </PullToRefresh>
    </SwipeablePageWrapper>
  );
};

export default Community;