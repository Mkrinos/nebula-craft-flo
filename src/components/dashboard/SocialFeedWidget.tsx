import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSignedImageUrls } from '@/hooks/useSignedImageUrl';
import { HorizontalSwipeContainer } from '@/components/HorizontalSwipeContainer';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { Heart, Users, Image as ImageIcon, ArrowRight } from 'lucide-react';

interface FeedItem {
  id: string;
  image_url: string;
  prompt: string;
  display_name: string | null;
  likes_count: number;
}

export function SocialFeedWidget() {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get signed URLs for all feed images
  const imageUrls = useMemo(() => feedItems.map(item => item.image_url), [feedItems]);
  const { getSignedUrl } = useSignedImageUrls(imageUrls);

  useEffect(() => {
    fetchFeed();
  }, [user]);

  const fetchFeed = async () => {
    try {
      // Get recent public images
      const { data: images } = await supabase
        .from('generated_images')
        .select('id, image_url, prompt, user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (!images || images.length === 0) {
        setFeedItems([]);
        setLoading(false);
        return;
      }

      // Get profiles
      const userIds = [...new Set(images.map(img => img.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      // Get likes
      const imageIds = images.map(img => img.id);
      const { data: likes } = await supabase
        .from('image_likes')
        .select('image_id')
        .in('image_id', imageIds);

      const likesMap = new Map<string, number>();
      (likes || []).forEach(l => {
        likesMap.set(l.image_id, (likesMap.get(l.image_id) || 0) + 1);
      });

      const items: FeedItem[] = images.map(img => ({
        id: img.id,
        image_url: img.image_url,
        prompt: img.prompt,
        display_name: profileMap.get(img.user_id) || null,
        likes_count: likesMap.get(img.id) || 0
      }));

      setFeedItems(items);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-6">
        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-3">No community posts yet</p>
        <SciFiButton asChild variant="ghost" size="sm">
          <Link to="/community">Explore Community</Link>
        </SciFiButton>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <HorizontalSwipeContainer showIndicators={false}>
        {feedItems.map((item) => (
          <Link
            key={item.id}
            to="/community"
            className="group relative w-24 h-24 rounded overflow-hidden border border-border/30 hover:border-neon-cyan/50 transition-all flex-shrink-0"
          >
            <img
              src={getSignedUrl(item.image_url)}
              alt={item.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
              <p className="text-[9px] text-foreground truncate">{item.display_name || 'Anonymous'}</p>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <Heart className="w-2.5 h-2.5" />
                <span className="text-[9px]">{item.likes_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </HorizontalSwipeContainer>
      
      <Link to="/community" className="flex items-center justify-center gap-1 text-[10px] text-neon-cyan hover:underline">
        View Community
        <ArrowRight className="w-2.5 h-2.5" />
      </Link>
    </div>
  );
}