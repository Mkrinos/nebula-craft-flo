import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSignedImageUrls } from '@/hooks/useSignedImageUrl';
import GlassCard from './GlassCard';
import { Button } from './ui/button';
import { 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  User,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  style: string | null;
  image_url: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
  };
}

interface ImageGalleryProps {
  onClose?: () => void;
  onSelectImage?: (imageUrl: string, prompt: string) => void;
}

const ImageGallery = ({ onClose, onSelectImage }: ImageGalleryProps) => {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Get signed URLs for all images
  const imageUrls = useMemo(() => images.map(img => img.image_url), [images]);
  const { getSignedUrl } = useSignedImageUrls(imageUrls);
  useEffect(() => {
    fetchImages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('gallery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_images'
        },
        () => {
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately for each unique user
      const userIds = [...new Set((data || []).map(img => img.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const imagesWithProfiles = (data || []).map(img => ({
        ...img,
        profiles: profileMap.get(img.user_id) || { display_name: null }
      }));
      
      setImages(imagesWithProfiles);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image: GeneratedImage) => {
    if (image.user_id !== user?.id) {
      haptic.trigger('error');
      toast.error('You can only delete your own images');
      return;
    }

    haptic.trigger('warning');
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;
      haptic.trigger('success');
      toast.success('Image deleted');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      haptic.trigger('error');
      toast.error('Failed to delete image');
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    haptic.trigger('selection');
    try {
      const signedUrl = getSignedUrl(image.image_url);
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `nexustouch-${image.id}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      haptic.trigger('success');
      toast.success('Image downloaded!');
    } catch (error) {
      haptic.trigger('error');
      toast.error('Failed to download image');
    }
  };

  const handleImageClick = (image: GeneratedImage) => {
    haptic.trigger('light');
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    haptic.trigger('light');
    setSelectedImage(null);
  };

  const handleClose = () => {
    haptic.trigger('light');
    onClose?.();
  };

  const handleSelectImage = (image: GeneratedImage) => {
    haptic.trigger('selection');
    const signedUrl = getSignedUrl(image.image_url);
    onSelectImage?.(signedUrl, image.prompt);
    setSelectedImage(null);
    onClose?.();
  };
  if (loading) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Community Gallery
        </h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={handleClose} className="min-h-[44px] min-w-[44px]">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No images yet. Be the first to create!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => {
            let touchTriggered = false;
            return (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-secondary/30 border border-border/50 cursor-pointer hover:border-primary/50 active:scale-[0.98] transition-all touch-manipulation"
                onPointerDown={(e) => {
                  if (e.pointerType === 'touch') {
                    touchTriggered = true;
                    handleImageClick(image);
                  }
                }}
                onClick={() => {
                  if (touchTriggered) {
                    touchTriggered = false;
                    return;
                  }
                  handleImageClick(image);
                }}
              >
                <img
                  src={getSignedUrl(image.image_url)}
                  alt={image.prompt}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                  <p className="text-xs text-foreground line-clamp-2">{image.prompt}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {image.profiles?.display_name || 'Unknown'}
                  </p>
                </div>
                {image.user_id === user?.id && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-xs bg-primary/80 text-primary-foreground px-2 py-1 rounded">
                      Yours
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <GlassCard 
            className="max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">
                Image Details
              </h3>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} className="min-h-[44px] min-w-[44px]">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-lg overflow-hidden bg-secondary/30">
                <img
                  src={getSignedUrl(selectedImage.image_url)}
                  alt={selectedImage.prompt}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prompt</p>
                  <p className="text-foreground">{selectedImage.prompt}</p>
                </div>
                
                {selectedImage.style && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Style</p>
                    <span className="inline-block px-2 py-1 rounded bg-primary/20 text-primary text-sm">
                      {selectedImage.style}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{selectedImage.profiles?.display_name || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(selectedImage.created_at), 'PPp')}</span>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  
                  {onSelectImage && (
                    <Button 
                      variant="neon" 
                      size="sm"
                      onClick={() => handleSelectImage(selectedImage)}
                    >
                      Use as Reference
                    </Button>
                  )}
                  
                  {selectedImage.user_id === user?.id && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleDelete(selectedImage)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </GlassCard>
  );
};

export default ImageGallery;
