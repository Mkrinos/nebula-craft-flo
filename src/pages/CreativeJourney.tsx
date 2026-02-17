import { useState, useCallback, useRef, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import creativeShowcaseVideo from '@/assets/creative-journey-showcase.mp4';
import StarfieldBackground from '@/components/StarfieldBackground';
import ImageGallery from '@/components/ImageGallery';
import PromptEnhancer from '@/components/PromptEnhancer';
import ImageAnimator from '@/components/ImageAnimator';
import VoiceInputButton from '@/components/VoiceInputButton';
import ImageGenerationSkeleton from '@/components/ImageGenerationSkeleton';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { SEOHead } from '@/components/SEOHead';
import { CreativeJourneyTour } from '@/components/creative-journey/CreativeJourneyTour';
import { CreditsExhaustedDialog } from '@/components/CreditsExhaustedDialog';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiTextarea } from '@/components/ui/sci-fi-input';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuests } from '@/hooks/useQuests';
import { useLanguage, promptPlaceholders, getPromptsByCategory, categoryLabels, categorizedPrompts, type PromptCategory } from '@/contexts/LanguageContext';
import { useGlobalPersona } from '@/contexts/GlobalPersonaContext';
import { useFavoritePrompts } from '@/hooks/useFavoritePrompts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Wand2, 
  Image, 
  Settings2, 
  Download, 
  Share2, 
  Heart,
  Maximize2,
  RefreshCw,
  FolderOpen,
  Save,
  LogIn,
  Play,
  Zap,
  Globe,
  Trees,
  Wand2 as WandIcon,
  Rocket,
  Shuffle,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';

const CreativeJourney = () => {
  const { user, session } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { settings } = useMotionSettings();
  const { detectLanguage, currentLanguage, getLanguageInfo } = useLanguage();
  const { triggerThink, triggerReact } = useGlobalPersona();
  const { favorites, isFavorite, toggleFavorite } = useFavoritePrompts();
  const { updateProgress } = useQuests();
  const haptic = useHapticFeedback();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [saveToGallery, setSaveToGallery] = useState(true);
  const [showAnimator, setShowAnimator] = useState(false);
  const [promptCategory, setPromptCategory] = useState<PromptCategory | 'favorites'>('all');
  const [tourHighlight, setTourHighlight] = useState<string | null>(null);
  const [showCreditsExhausted, setShowCreditsExhausted] = useState(false);
  
  // Parallax state for starfield
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const showcaseRef = useRef<HTMLDivElement>(null);
  const lastParallaxUpdate = useRef(0);
  const PARALLAX_THROTTLE_MS = 32; // ~30fps for smooth but efficient updates
  
  // Handle mouse/touch movement for parallax with throttling
  const handleParallaxMove = useCallback((clientX: number, clientY: number) => {
    if (!showcaseRef.current || settings.performanceMode === 'minimal') return;
    
    // Throttle updates for better performance on mobile
    const now = Date.now();
    if (now - lastParallaxUpdate.current < PARALLAX_THROTTLE_MS) return;
    lastParallaxUpdate.current = now;
    
    const rect = showcaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate offset from center (-1 to 1)
    const offsetX = (clientX - centerX) / (rect.width / 2);
    const offsetY = (clientY - centerY) / (rect.height / 2);
    
    // Clamp values
    const clampedX = Math.max(-1, Math.min(1, offsetX));
    const clampedY = Math.max(-1, Math.min(1, offsetY));
    
    setParallax({ x: clampedX, y: clampedY });
  }, [settings.performanceMode]);
  
  // Mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleParallaxMove(e.clientX, e.clientY);
  }, [handleParallaxMove]);
  
  // Touch move handler - passive for better scroll performance
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleParallaxMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleParallaxMove]);
  
  // Reset parallax when mouse leaves
  const handleMouseLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  // Handle prompt change with language detection
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    if (value.length > 10) {
      const detected = detectLanguage(value);
      if (detected !== currentLanguage) {
        setDetectedLang(detected);
      } else {
        setDetectedLang(null);
      }
    }
  };

  // Handle voice input
  const handleVoiceInput = (transcript: string) => {
    setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
    triggerReact();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Haptic feedback on generate
    haptic.trigger('medium');
    
    if (!user && saveToGallery) {
      toast.error('Please sign in to save images to the gallery');
      return;
    }
    
    setGenerating(true);
    setGeneratedImage(null);
    triggerThink();
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: prompt.trim(),
          style: selectedStyle,
          saveToGallery: saveToGallery && !!user
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.image) {
        setGeneratedImage(data.image);
        triggerReact();
        
        // Haptic feedback for successful generation
        haptic.trigger('success');
        
        // Update quest progress for image generation
        if (user) {
          updateProgress('image_generation', 1);
        }
        
        if (data.cached) {
          toast.success('Image retrieved from cache - no credits used!');
        } else if (data.saved) {
          // Extra celebratory haptic for saved images
          setTimeout(() => haptic.trigger('achievement'), 300);
          toast.success('Image generated and saved to gallery!');
        } else {
          toast.success('Image generated successfully!');
        }
      } else {
        throw new Error('No image received');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Check if it's a credits exhausted error
      const errorMessage = error.message || '';
      if (errorMessage.toLowerCase().includes('credits') || errorMessage.includes('upgrade')) {
        haptic.trigger('error');
        setShowCreditsExhausted(true);
      } else {
        haptic.trigger('warning');
        toast.error(errorMessage || 'Failed to generate image');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    haptic.trigger('success');
    
    try {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `nexustouch-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const stylePresets = [
    'Cyberpunk', 'Fantasy', 'Realistic', 'Anime', 
    'Abstract', 'Vintage', 'Minimalist', 'Surreal'
  ];

  // Get localized quick prompts based on current language and category
  const localizedQuickPrompts = promptCategory === 'favorites' 
    ? favorites.map(f => f.prompt_text)
    : getPromptsByCategory(currentLanguage, promptCategory as PromptCategory);

  const categoryIcons: Record<PromptCategory | 'favorites', React.ReactNode> = {
    all: <Sparkles className="w-3 h-3" />,
    nature: <Trees className="w-3 h-3" />,
    fantasy: <WandIcon className="w-3 h-3" />,
    scifi: <Rocket className="w-3 h-3" />,
    favorites: <Star className="w-3 h-3" />,
  };

  const extendedCategoryLabels: Record<'favorites', Record<string, string>> = {
    favorites: {
      en: 'Favorites', es: 'Favoritos', fr: 'Favoris', de: 'Favoriten', 
      it: 'Preferiti', pt: 'Favoritos', ja: 'お気に入り', ko: '즐겨찾기', 
      zh: '收藏', ar: 'المفضلة', hi: 'पसंदीदा', ru: 'Избранное'
    }
  };

  // Random prompt picker
  const handleRandomPrompt = () => {
    const allPrompts = categorizedPrompts[currentLanguage] || categorizedPrompts.en;
    if (allPrompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * allPrompts.length);
      const randomPrompt = allPrompts[randomIndex];
      handlePromptChange(randomPrompt.text);
      
      // Optionally switch to the category of the random prompt
      setPromptCategory(randomPrompt.category);
      
      // Haptic feedback
      haptic.trigger('selection');
    }
  };

  if (showGallery) {
    return (
      <div className="min-h-screen relative">
        <StarfieldBackground />
        <Navigation />
        
        <main className="relative z-10 pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <ImageGallery 
              onClose={() => setShowGallery(false)}
              onSelectImage={(url, promptText) => {
                setPrompt(promptText);
                setShowGallery(false);
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success('Page refreshed');
  }, []);

  return (
    <SwipeablePageWrapper>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen relative">
        <SEOHead 
          title="Creative Journey - Generate AI Art"
          description="Create stunning AI-generated images with NexusTouch. Use prompts, style presets, and personas to bring your imagination to life."
        />
        <StarfieldBackground />
        <Navigation />
      
      <main className="relative z-10 pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 pb-safe">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                  <span className="text-gradient">Creative Journey</span>
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                  Transform your imagination into stunning visuals with AI
                </p>
              </div>
              
              {/* Credits indicator */}
              {user && !subscriptionLoading && subscription && (
                <SciFiFrame glowIntensity="subtle" className="hidden sm:flex px-3 py-2 items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-cyan" />
                  <div className="text-right">
                    <p className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Credits</p>
                    <p className="text-lg font-display font-bold text-neon-cyan">
                      {subscription.credits_remaining === -1 ? '∞' : subscription.credits_remaining}
                    </p>
                  </div>
                </SciFiFrame>
              )}
            </div>
            
            {user ? (
              <SciFiButton 
                variant="default" 
                shape="angled"
                onClick={() => setShowGallery(true)}
                className={cn(
                  "gap-2 w-full sm:w-auto touch-target",
                  tourHighlight === 'gallery-button' && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                View Gallery
              </SciFiButton>
            ) : (
              <SciFiButton 
                variant="accent" 
                shape="angled"
                onClick={() => navigate('/auth')}
                className="gap-2 w-full sm:w-auto touch-target"
              >
                <LogIn className="w-4 h-4" />
                Sign in to Save
              </SciFiButton>
            )}
          </div>

          {/* Mobile credits indicator */}
          {user && !subscriptionLoading && subscription && (
            <SciFiFrame glowIntensity="subtle" className="sm:hidden flex flex-col px-4 py-3 mb-6 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                  <div>
                    <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">Credits Remaining</p>
                    <p className="text-xl font-display font-bold text-neon-cyan">
                      {subscription.credits_remaining === -1 ? '∞' : subscription.credits_remaining}
                    </p>
                  </div>
                </div>
                <SciFiButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    haptic.trigger('selection');
                    navigate('/billing');
                  }}
                  className="text-xs"
                >
                  Get More
                </SciFiButton>
              </div>
              {subscription.credits_remaining !== -1 && subscription.credits_limit > 0 && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{subscription.credits_used} used</span>
                    <span>{subscription.credits_limit} total</span>
                  </div>
                  <div className="h-2 bg-background/50 rounded-full overflow-hidden border border-neon-cyan/20">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
                      style={{ width: `${Math.min(100, (subscription.credits_used / subscription.credits_limit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </SciFiFrame>
          )}

          {/* Showcase Video Banner */}
          <div className="mb-6 sm:mb-8">
            <div 
              ref={showcaseRef}
              className="relative"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
            >
              {/* Animated Starfield Background with Parallax */}
              {settings.performanceMode !== 'minimal' && settings.enableParticles && (
                <>
                  {/* Stars Layer 1 - Background (slow parallax) */}
                  <div 
                    className="absolute -inset-4 pointer-events-none overflow-hidden rounded-xl z-0"
                    style={{
                      transform: `translate(${parallax.x * 3}px, ${parallax.y * 3}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    {[...Array(settings.performanceMode === 'full' ? 12 : 6)].map((_, i) => (
                      <div
                        key={`star-bg-${i}`}
                        className="absolute rounded-full bg-white/60"
                        style={{
                          width: `${1 + (i % 2)}px`,
                          height: `${1 + (i % 2)}px`,
                          left: `${(i * 19) % 100}%`,
                          top: `${(i * 27) % 100}%`,
                          opacity: 0.2 + (i % 4) * 0.1,
                          animation: settings.performanceMode === 'full' 
                            ? `twinkle ${3 + (i % 2)}s ease-in-out infinite`
                            : 'none',
                          animationDelay: `${i * 0.3}s`,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Stars Layer 2 - Midground (medium parallax) */}
                  <div 
                    className="absolute -inset-4 pointer-events-none overflow-hidden rounded-xl z-0"
                    style={{
                      transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)`,
                      transition: 'transform 0.1s ease-out',
                    }}
                  >
                    {[...Array(settings.performanceMode === 'full' ? 10 : 5)].map((_, i) => (
                      <div
                        key={`star-mid-${i}`}
                        className="absolute rounded-full bg-white"
                        style={{
                          width: `${1.5 + (i % 2)}px`,
                          height: `${1.5 + (i % 2)}px`,
                          left: `${(i * 23 + 11) % 100}%`,
                          top: `${(i * 31 + 7) % 100}%`,
                          opacity: 0.4 + (i % 3) * 0.15,
                          animation: settings.performanceMode === 'full' 
                            ? `twinkle ${2 + (i % 3)}s ease-in-out infinite`
                            : 'none',
                          animationDelay: `${i * 0.25}s`,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Stars Layer 3 - Foreground (fast parallax) */}
                  <div 
                    className="absolute -inset-4 pointer-events-none overflow-hidden rounded-xl z-0"
                    style={{
                      transform: `translate(${parallax.x * 15}px, ${parallax.y * 15}px)`,
                      transition: 'transform 0.05s ease-out',
                    }}
                  >
                    {[...Array(settings.performanceMode === 'full' ? 8 : 4)].map((_, i) => (
                      <div
                        key={`star-fg-${i}`}
                        className="absolute rounded-full bg-white"
                        style={{
                          width: `${2 + (i % 2)}px`,
                          height: `${2 + (i % 2)}px`,
                          left: `${(i * 29 + 5) % 100}%`,
                          top: `${(i * 37 + 13) % 100}%`,
                          opacity: 0.5 + (i % 2) * 0.2,
                          animation: settings.performanceMode === 'full' 
                            ? `twinkle ${1.5 + (i % 2)}s ease-in-out infinite`
                            : 'none',
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                    
                    {/* Shooting Stars */}
                    {settings.performanceMode === 'full' && (
                      <>
                        <div 
                          className="absolute w-12 h-px bg-gradient-to-r from-neon-cyan via-white to-transparent"
                          style={{
                            animation: 'shootingStar 6s linear infinite',
                            animationDelay: '0s',
                          }}
                        />
                        <div 
                          className="absolute w-8 h-px bg-gradient-to-r from-neon-purple via-white to-transparent"
                          style={{
                            animation: 'shootingStar 8s linear infinite',
                            animationDelay: '3s',
                          }}
                        />
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Orbiting Energy Particles with Parallax */}
              {settings.performanceMode === 'full' && settings.enableParticles && (
                <div 
                  className="absolute inset-0 pointer-events-none z-30"
                  style={{
                    transform: `translate(${parallax.x * 20}px, ${parallax.y * 20}px)`,
                    transition: 'transform 0.08s ease-out',
                  }}
                >
                  <div 
                    className="absolute w-2 h-2 bg-neon-cyan rounded-full blur-[2px]"
                    style={{
                      animation: 'orbit 8s linear infinite',
                      transformOrigin: '50% 50%',
                    }}
                  />
                  <div 
                    className="absolute w-1.5 h-1.5 bg-neon-purple rounded-full blur-[1px]"
                    style={{
                      animation: 'orbit 12s linear infinite reverse',
                      transformOrigin: '50% 50%',
                    }}
                  />
                </div>
              )}

              {/* Corner Glow Pulses - Enhanced */}
              {settings.performanceMode !== 'minimal' && settings.enableGlow && (
                <>
                  <div className={cn(
                    "absolute -top-2 -left-2 w-12 h-12 bg-neon-cyan/30 rounded-full blur-2xl pointer-events-none z-10",
                    settings.performanceMode === 'full' && "animate-pulse"
                  )} />
                  <div className={cn(
                    "absolute -top-2 -right-2 w-12 h-12 bg-neon-purple/30 rounded-full blur-2xl pointer-events-none z-10",
                    settings.performanceMode === 'full' && "animate-pulse [animation-delay:0.5s]"
                  )} />
                  <div className={cn(
                    "absolute -bottom-2 -left-2 w-12 h-12 bg-neon-purple/30 rounded-full blur-2xl pointer-events-none z-10",
                    settings.performanceMode === 'full' && "animate-pulse [animation-delay:1s]"
                  )} />
                  <div className={cn(
                    "absolute -bottom-2 -right-2 w-12 h-12 bg-neon-cyan/30 rounded-full blur-2xl pointer-events-none z-10",
                    settings.performanceMode === 'full' && "animate-pulse [animation-delay:1.5s]"
                  )} />
                  
                  {/* Energy Lines */}
                  {settings.performanceMode === 'full' && (
                    <>
                      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent pointer-events-none z-10 animate-pulse" />
                      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent pointer-events-none z-10 animate-pulse [animation-delay:1s]" />
                    </>
                  )}
                </>
              )}

              {/* Floating Sparkle Particles */}
              {settings.performanceMode === 'full' && settings.enableParticles && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-neon-cyan rounded-full"
                      style={{
                        left: `${10 + i * 12}%`,
                        top: `${5 + (i % 4) * 25}%`,
                        animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                        opacity: 0.5 + (i % 3) * 0.2,
                      }}
                    />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`purple-${i}`}
                      className="absolute w-1.5 h-1.5 bg-neon-purple rounded-full"
                      style={{
                        right: `${8 + i * 15}%`,
                        bottom: `${10 + (i % 3) * 30}%`,
                        animation: `float ${4 + (i % 2)}s ease-in-out infinite reverse`,
                        animationDelay: `${i * 0.7}s`,
                        opacity: 0.4 + (i % 2) * 0.3,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Holographic Grid Overlay */}
              {settings.performanceMode === 'full' && settings.enableTransitions && (
                <div 
                  className="absolute inset-0 pointer-events-none z-5 opacity-[0.03]"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, hsl(var(--neon-cyan)) 1px, transparent 1px),
                      linear-gradient(to bottom, hsl(var(--neon-cyan)) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />
              )}

              {/* Pulsing Energy Rings */}
              {settings.performanceMode === 'full' && settings.enableGlow && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
                  <div 
                    className="absolute w-[90%] h-[90%] rounded-lg border border-neon-cyan/40"
                    style={{
                      animation: 'energyRing 4s ease-out infinite',
                    }}
                  />
                  <div 
                    className="absolute w-[90%] h-[90%] rounded-lg border border-neon-purple/30"
                    style={{
                      animation: 'energyRing 4s ease-out infinite',
                      animationDelay: '2s',
                    }}
                  />
                </div>
              )}

              <SciFiFrame glowIntensity="medium" animated className="overflow-hidden relative z-10">
                <div className="relative flex items-center justify-center bg-space-dark/30 h-[180px] sm:h-[240px] lg:h-auto">
                  <video
                    src={creativeShowcaseVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-auto h-full max-w-full lg:w-full lg:h-auto lg:max-h-[400px] object-contain"
                  />
                  
                  {/* Scanning Line Overlay */}
                  {settings.performanceMode === 'full' && settings.enableTransitions && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                      <div 
                        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"
                        style={{
                          animation: 'videoScan 4s ease-in-out infinite',
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-space-dark/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <SciFiBadge variant="accent" className="mb-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-Powered Creation
                    </SciFiBadge>
                    <p className="text-sm sm:text-base text-foreground/90 max-w-lg">
                      Watch your imagination come to life with our advanced AI generation tools
                    </p>
                  </div>
                </div>
              </SciFiFrame>

              {/* Custom Animations */}
              <style>{`
                @keyframes videoScan {
                  0% { top: 0%; opacity: 0; }
                  5% { opacity: 0.8; }
                  95% { opacity: 0.8; }
                  100% { top: 100%; opacity: 0; }
                }
                @keyframes twinkle {
                  0%, 100% { opacity: 0.3; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.2); }
                }
                @keyframes shootingStar {
                  0% { left: -5%; top: 10%; opacity: 0; }
                  10% { opacity: 1; }
                  30% { opacity: 1; }
                  40% { left: 110%; top: 50%; opacity: 0; }
                  100% { left: 110%; top: 50%; opacity: 0; }
                }
                @keyframes orbit {
                  0% { transform: rotate(0deg) translateX(calc(50% + 20px)) rotate(0deg); }
                  100% { transform: rotate(360deg) translateX(calc(50% + 20px)) rotate(-360deg); }
                }
                @keyframes float {
                  0%, 100% { transform: translateY(0) translateX(0); }
                  25% { transform: translateY(-8px) translateX(4px); }
                  50% { transform: translateY(-4px) translateX(-4px); }
                  75% { transform: translateY(-12px) translateX(2px); }
                }
                @keyframes energyRing {
                  0% { transform: scale(1); opacity: 0.6; }
                  100% { transform: scale(1.15); opacity: 0; }
                }
              `}</style>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Input Section */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
              <SciFiPanel 
                title="IMAGE PROMPT" 
                headerRight={
                  <div className="flex items-center gap-2">
                    <VoiceInputButton onTranscript={handleVoiceInput} />
                    <Wand2 className="w-4 h-4 text-neon-cyan hidden sm:block" />
                  </div>
                }
                className={cn(
                  tourHighlight === 'prompt-input' && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <SciFiTextarea
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder={promptPlaceholders[currentLanguage]}
                  className="min-h-[100px] sm:min-h-[120px] text-base"
                  dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                />

                {/* Save to Favorites Button */}
                {user && prompt.trim() && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        haptic.trigger('selection');
                        toggleFavorite(prompt, 'custom', currentLanguage);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-xs font-display uppercase tracking-wider border transition-all touch-target ${
                        isFavorite(prompt)
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-400'
                          : 'border-neon-cyan/30 bg-space-dark/50 text-muted-foreground hover:border-amber-500/40 hover:text-amber-400'
                      }`}
                      style={{
                        clipPath: "polygon(0 2px, 2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px))"
                      }}
                    >
                      <Star className={`w-3 h-3 ${isFavorite(prompt) ? 'fill-amber-400' : ''}`} />
                      {isFavorite(prompt) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                )}

                {/* Language detection indicator */}
                {detectedLang && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span>Detected: {getLanguageInfo(detectedLang as any).nativeName}</span>
                  </div>
                )}

                <div className="mt-3 sm:mt-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p className="text-[10px] sm:text-xs font-display uppercase tracking-widest text-muted-foreground">
                      {currentLanguage === 'en' ? 'Quick Prompts:' : 
                       currentLanguage === 'es' ? 'Sugerencias:' :
                       currentLanguage === 'fr' ? 'Suggestions:' :
                       currentLanguage === 'de' ? 'Vorschläge:' :
                       currentLanguage === 'it' ? 'Suggerimenti:' :
                       currentLanguage === 'pt' ? 'Sugestões:' :
                       currentLanguage === 'ja' ? 'クイックプロンプト:' :
                       currentLanguage === 'ko' ? '빠른 프롬프트:' :
                       currentLanguage === 'zh' ? '快速提示:' :
                       currentLanguage === 'ar' ? 'اقتراحات سريعة:' :
                       currentLanguage === 'hi' ? 'त्वरित सुझाव:' :
                       currentLanguage === 'ru' ? 'Быстрые подсказки:' : 'Quick Prompts:'}
                    </p>
                    
                    {/* Random Prompt Button */}
                    <button
                      onClick={handleRandomPrompt}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-display uppercase tracking-wider border border-neon-purple/40 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 hover:border-neon-purple/60 transition-all touch-target"
                      style={{
                        clipPath: "polygon(0 2px, 2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px))"
                      }}
                      title={currentLanguage === 'en' ? 'Random prompt' : 'Random'}
                    >
                      <Shuffle className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {currentLanguage === 'en' ? 'Random' : 
                         currentLanguage === 'es' ? 'Aleatorio' :
                         currentLanguage === 'fr' ? 'Aléatoire' :
                         currentLanguage === 'de' ? 'Zufällig' :
                         currentLanguage === 'it' ? 'Casuale' :
                         currentLanguage === 'pt' ? 'Aleatório' :
                         currentLanguage === 'ja' ? 'ランダム' :
                         currentLanguage === 'ko' ? '랜덤' :
                         currentLanguage === 'zh' ? '随机' :
                         currentLanguage === 'ar' ? 'عشوائي' :
                         currentLanguage === 'hi' ? 'यादृच्छिक' :
                         currentLanguage === 'ru' ? 'Случайно' : 'Random'}
                      </span>
                    </button>
                  </div>
                  
                  {/* Category Filter Buttons */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(['all', 'nature', 'fantasy', 'scifi', ...(user ? ['favorites'] : [])] as (PromptCategory | 'favorites')[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          haptic.trigger('light');
                          setPromptCategory(cat);
                        }}
                        className={`
                          flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-display uppercase tracking-wider
                          border transition-all touch-target
                          ${promptCategory === cat 
                            ? cat === 'favorites' 
                              ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                              : 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan' 
                            : 'border-neon-cyan/30 bg-space-dark/50 text-muted-foreground hover:border-neon-cyan/50 hover:text-foreground'
                          }
                        `}
                        style={{
                          clipPath: "polygon(0 2px, 2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px))"
                        }}
                      >
                        {categoryIcons[cat]}
                        <span>
                          {cat === 'favorites' 
                            ? extendedCategoryLabels.favorites[currentLanguage] || 'Favorites'
                            : categoryLabels[cat][currentLanguage]}
                        </span>
                        {cat === 'favorites' && favorites.length > 0 && (
                          <span className="ml-1 text-[9px] opacity-70">({favorites.length})</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-neon-cyan/30 scrollbar-track-transparent">
                    {localizedQuickPrompts.map((p, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            haptic.trigger('light');
                            handlePromptChange(p);
                          }}
                          className="flex-1 text-left text-xs sm:text-sm p-2.5 sm:p-3 border border-neon-cyan/20 bg-space-dark/50 hover:bg-neon-cyan/10 hover:border-neon-cyan/40 text-foreground/80 hover:text-foreground transition-all truncate touch-target"
                          style={{
                            clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))"
                          }}
                          dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {p}
                        </button>
                        {user && promptCategory !== 'favorites' && (
                          <button
                            onClick={() => {
                              haptic.trigger('selection');
                              toggleFavorite(p, promptCategory === 'all' ? 'mixed' : promptCategory, currentLanguage);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-amber-400 transition-colors touch-target"
                            title={isFavorite(p) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFavorite(p) ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        )}
                      </div>
                    ))}
                    {localizedQuickPrompts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {promptCategory === 'favorites' 
                          ? (currentLanguage === 'en' ? 'No favorites yet. Save prompts you love!' : 'No favorites saved')
                          : (currentLanguage === 'en' ? 'No prompts in this category' : 'No prompts available')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prompt Enhancer */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neon-cyan/20">
                  <PromptEnhancer 
                    prompt={prompt} 
                    onEnhance={(enhanced) => handlePromptChange(enhanced)} 
                  />
                </div>
              </SciFiPanel>

              <SciFiPanel 
                title="STYLE PRESETS" 
                headerRight={<Settings2 className="w-4 h-4 text-neon-cyan" />}
                className={cn(
                  tourHighlight === 'style-presets' && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {stylePresets.map((style) => (
                    <SciFiButton
                      key={style}
                      variant={selectedStyle === style ? "accent" : "ghost"}
                      size="sm"
                      onClick={() => {
                        haptic.trigger('light');
                        setSelectedStyle(selectedStyle === style ? null : style);
                      }}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      {style}
                    </SciFiButton>
                  ))}
                </div>
                
                {user && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neon-cyan/20">
                    <label className="flex items-center gap-3 cursor-pointer group touch-target">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${saveToGallery ? 'border-neon-cyan bg-neon-cyan/20' : 'border-neon-cyan/40'}`}>
                        {saveToGallery && <div className="w-2 h-2 bg-neon-cyan" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={saveToGallery}
                        onChange={(e) => setSaveToGallery(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-sm text-foreground flex items-center gap-2 group-hover:text-neon-cyan transition-colors">
                        <Save className="w-4 h-4" />
                        Save to gallery
                      </span>
                    </label>
                  </div>
                )}
              </SciFiPanel>

              <SciFiButton 
                variant="primary" 
                size="xl" 
                shape="angled"
                className={cn(
                  "w-full group touch-target",
                  tourHighlight === 'generate-button' && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
                )}
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Generate Image
                  </>
                )}
              </SciFiButton>

              <p className="text-center text-[10px] sm:text-xs font-display uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                <Zap className="w-3 h-3 text-neon-cyan" />
                Powered by Lovable AI
              </p>
            </div>

            <div className={cn(
              "lg:col-span-2 order-1 lg:order-2",
              tourHighlight === 'output-area' && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
            )}>
              <SciFiFrame 
                glowIntensity={generatedImage ? 'medium' : 'subtle'} 
                animated 
                className="p-3 sm:p-6 h-full"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="font-display text-xs sm:text-sm uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Image className="w-3 h-3 sm:w-4 sm:h-4 text-neon-cyan" />
                    <span className="hidden xs:inline">Generated Artwork</span>
                    <span className="xs:hidden">Artwork</span>
                  </h2>
                  
                  {generatedImage && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <SciFiButton 
                        variant={showAnimator ? "accent" : "ghost"} 
                        size="icon"
                        onClick={() => {
                          haptic.trigger('selection');
                          setShowAnimator(!showAnimator);
                        }}
                        title="Animate image"
                        className="w-8 h-8 sm:w-9 sm:h-9"
                      >
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </SciFiButton>
                      <SciFiButton variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9 hidden sm:flex">
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </SciFiButton>
                      <SciFiButton variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9 hidden sm:flex">
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </SciFiButton>
                      <SciFiButton variant="ghost" size="icon" onClick={handleDownload} className="w-8 h-8 sm:w-9 sm:h-9">
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </SciFiButton>
                      <SciFiButton variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9 hidden sm:flex">
                        <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </SciFiButton>
                    </div>
                  )}
                </div>

                <div 
                  className="aspect-square border-2 border-neon-cyan/30 bg-space-dark/50 flex items-center justify-center overflow-hidden"
                  style={{
                    clipPath: "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))"
                  }}
                >
                {generating ? (
                    <ImageGenerationSkeleton />
                  ) : generatedImage ? (
                    showAnimator ? (
                      <div className="w-full h-full p-2 sm:p-4">
                        <ImageAnimator imageUrl={generatedImage} prompt={prompt} />
                      </div>
                    ) : (
                      <div className="relative w-full h-full group">
                        <img 
                          src={generatedImage} 
                          alt="Generated artwork"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-space-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 lg:transition-opacity flex items-end p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-foreground line-clamp-2">{prompt}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-4 sm:p-8">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 border-2 border-neon-cyan/40 bg-neon-cyan/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-neon-cyan" />
                      </div>
                      <h3 className="font-display text-base sm:text-xl text-foreground mb-1 sm:mb-2">
                        Start Your Creative Journey
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                        Enter a detailed prompt and let AI transform your vision into stunning artwork
                      </p>
                    </div>
                  )}
                </div>

                {generatedImage && (
                  <div className="mt-4 flex items-center justify-between">
                    <SciFiButton 
                      variant="default" 
                      size="sm"
                      shape="angled" 
                      className="gap-2"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </SciFiButton>
                    {selectedStyle && (
                      <SciFiBadge variant="accent">{selectedStyle}</SciFiBadge>
                    )}
                  </div>
                )}
              </SciFiFrame>
            </div>
          </div>
        </div>
      </main>
      
        {/* Music Player is now rendered globally in App.tsx for seamless playback */}
        {/* Performance Dashboard */}
        {settings.showPerformanceDashboard && <PerformanceDashboard />}
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Onboarding Tour */}
        <CreativeJourneyTour onHighlight={setTourHighlight} />
        
        {/* Credits Exhausted Dialog */}
        <CreditsExhaustedDialog 
          open={showCreditsExhausted} 
          onOpenChange={setShowCreditsExhausted} 
        />
      </div>
      </PullToRefresh>
    </SwipeablePageWrapper>
  );
};

export default CreativeJourney;
