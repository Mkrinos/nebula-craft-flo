import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSignedImageUrls } from '@/hooks/useSignedImageUrl';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import { PullToRefresh } from '@/components/PullToRefresh';
import StarfieldBackground from '@/components/StarfieldBackground';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  RefreshCw, 
  Download,
  Share2,
  X,
  Sparkles
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  style: string | null;
  image_url: string;
  created_at: string;
  is_public: boolean;
}

const GenerationHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Get signed URLs for all images
  const imageUrls = useMemo(() => images.map(img => img.image_url), [images]);
  const { getSignedUrl } = useSignedImageUrls(imageUrls);

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getImagesForDay = (day: Date) => {
    return images.filter(img => isSameDay(new Date(img.created_at), day));
  };

  const handlePrevMonth = () => {
    haptic.trigger('light');
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    haptic.trigger('light');
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleRegenerate = (image: GeneratedImage) => {
    haptic.trigger('selection');
    // Navigate to creative journey with the prompt pre-filled
    navigate('/creative-journey', { 
      state: { 
        referencePrompt: image.prompt,
        referenceStyle: image.style 
      } 
    });
  };

  const handleShare = async (image: GeneratedImage) => {
    haptic.trigger('selection');
    const signedUrl = getSignedUrl(image.image_url);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My NexusTouch Creation',
          text: image.prompt,
          url: signedUrl
        });
        haptic.trigger('success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(signedUrl);
        }
      }
    } else {
      copyToClipboard(signedUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    haptic.trigger('success');
  };

  const handleDownload = async (image: GeneratedImage) => {
    haptic.trigger('selection');
    const signedUrl = getSignedUrl(image.image_url);
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = `nexustouch-${image.id}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const handleRefresh = useCallback(async () => {
    await fetchImages();
    toast.success('History refreshed');
  }, []);

  const totalCreations = images.length;
  const thisMonthCreations = images.filter(img => 
    isSameMonth(new Date(img.created_at), currentMonth)
  ).length;

  if (!user) {
    return (
      <SwipeablePageWrapper>
        <div className="min-h-screen relative flex items-center justify-center">
          <StarfieldBackground />
          <SciFiFrame className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your history</p>
            <Link to="/auth">
              <SciFiButton variant="primary">Sign In</SciFiButton>
            </Link>
          </SciFiFrame>
        </div>
      </SwipeablePageWrapper>
    );
  }

  return (
    <SwipeablePageWrapper>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen relative">
        <StarfieldBackground />
        <Navigation />

        <main className="relative z-10 pt-16 sm:pt-20 md:pt-24 pb-24 md:pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BackButton />
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                    <Calendar className="w-7 h-7 text-neon-cyan" />
                    Generation History
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Your creative journey through time
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <SciFiBadge variant="default">{totalCreations} total</SciFiBadge>
                <SciFiBadge variant="success">{thisMonthCreations} this month</SciFiBadge>
              </div>
            </div>

            {/* Calendar Navigation */}
            <SciFiFrame className="mb-6 p-4">
              <div className="flex items-center justify-between">
                <SciFiButton variant="ghost" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </SciFiButton>
                <h2 className="font-display text-xl font-bold text-foreground">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <SciFiButton variant="ghost" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </SciFiButton>
              </div>
            </SciFiFrame>

            {/* Calendar Grid */}
            <SciFiPanel title="CALENDAR VIEW" status="active">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-display uppercase tracking-wider text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the first of month */}
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {daysInMonth.map(day => {
                      const dayImages = getImagesForDay(day);
                      const hasImages = dayImages.length > 0;
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={day.toISOString()}
                          className={`
                            aspect-square p-1 border transition-all cursor-pointer touch-manipulation active:scale-[0.98]
                            ${isToday ? 'border-neon-cyan bg-neon-cyan/10' : 'border-border/30'}
                            ${hasImages ? 'hover:border-neon-cyan/70 hover:bg-neon-cyan/5' : 'hover:bg-muted/30'}
                          `}
                          onPointerDown={(e) => {
                            if (e.pointerType === "touch" && hasImages) {
                              e.preventDefault();
                              setSelectedImage(dayImages[0]);
                            }
                          }}
                          onClick={(e) => {
                            if (e.detail === 0) return;
                            hasImages && setSelectedImage(dayImages[0]);
                          }}
                        >
                          <div className="flex flex-col h-full">
                            <span className={`text-xs font-display ${isToday ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                              {format(day, 'd')}
                            </span>
                            {hasImages && (
                              <div className="flex-1 flex items-center justify-center">
                                {dayImages.length <= 2 ? (
                                  <div className="flex gap-0.5">
                                    {dayImages.slice(0, 2).map((img, i) => (
                                      <img 
                                        key={img.id} 
                                        src={getSignedUrl(img.image_url)} 
                                        alt="" 
                                        className="w-6 h-6 object-cover rounded-sm border border-neon-cyan/30"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <img 
                                      src={getSignedUrl(dayImages[0].image_url)} 
                                      alt="" 
                                      className="w-8 h-8 object-cover rounded-sm border border-neon-cyan/30"
                                    />
                                    <span className="absolute -bottom-1 -right-1 text-[10px] bg-neon-cyan text-space-dark px-1 rounded font-bold">
                                      +{dayImages.length - 1}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </SciFiPanel>

            {/* Selected Day Images */}
            {selectedImage && (
              <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
                <SciFiFrame className="max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-neon-cyan" />
                      {format(new Date(selectedImage.created_at), 'MMMM d, yyyy')}
                    </h3>
                    <SciFiButton variant="ghost" size="sm" onClick={() => setSelectedImage(null)}>
                      <X className="w-5 h-5" />
                    </SciFiButton>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="aspect-square rounded-lg overflow-hidden border border-neon-cyan/30">
                      <img
                        src={getSignedUrl(selectedImage.image_url)}
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

                      <div>
                        <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Created</p>
                        <p className="text-foreground text-sm">
                          {format(new Date(selectedImage.created_at), 'PPp')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4">
                        <SciFiButton
                          variant="primary" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleRegenerate(selectedImage)}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Re-generate
                        </SciFiButton>
                        <SciFiButton 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleDownload(selectedImage)}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </SciFiButton>
                        <SciFiButton 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleShare(selectedImage)}
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </SciFiButton>
                      </div>

                      {/* Quick navigation to same day images */}
                      {images.filter(img => 
                        isSameDay(new Date(img.created_at), new Date(selectedImage.created_at)) &&
                        img.id !== selectedImage.id
                      ).length > 0 && (
                        <div className="pt-4 border-t border-border/30">
                          <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
                            More from this day
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {images
                              .filter(img => 
                                isSameDay(new Date(img.created_at), new Date(selectedImage.created_at)) &&
                                img.id !== selectedImage.id
                              )
                              .slice(0, 4)
                              .map(img => (
                                <button
                                  key={img.id}
                                  onClick={() => setSelectedImage(img)}
                                  className="w-12 h-12 rounded border border-neon-cyan/30 overflow-hidden hover:border-neon-cyan transition-colors"
                                >
                                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </SciFiFrame>
              </div>
            )}
          </div>
        </main>

        <MobileBottomNav />
      </div>
      </PullToRefresh>
    </SwipeablePageWrapper>
  );
};

export default GenerationHistory;