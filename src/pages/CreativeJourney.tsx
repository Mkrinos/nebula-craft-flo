import { useState, useCallback, useRef } from 'react';
import Navigation from '@/components/Navigation';
import creativeShowcaseVideo from '@/assets/creative-journey-showcase.mp4';
import StarfieldBackground from '@/components/StarfieldBackground';
import ImageGallery from '@/components/ImageGallery';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { SEOHead } from '@/components/SEOHead';
import { CreativeJourneyTour } from '@/components/creative-journey/CreativeJourneyTour';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sparkles, FolderOpen, LogIn, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { CreationJourney, generalCreateDefinition } from '@/modules/creation';
import { invokeGenerateImage } from '@/modules/creation/generateAdapter';

const CreativeJourney = () => {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { settings } = useMotionSettings();
  const haptic = useHapticFeedback();
  const navigate = useNavigate();
  const [showGallery, setShowGallery] = useState(false);
  const [tourHighlight, setTourHighlight] = useState<string | null>(null);
  
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

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success('Page refreshed');
  }, []);


  if (showGallery) {
    return (
      <div className="min-h-screen relative">
        <StarfieldBackground />
        <Navigation />
        
        <main className="relative z-10 pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <ImageGallery 
              onClose={() => setShowGallery(false)}
              onSelectImage={() => setShowGallery(false)}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <SwipeablePageWrapper>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen relative">
        <SEOHead 
          title="Creative Journey - Generate AI Art"
          description="Create stunning AI-generated images with NexusTouch. Use prompts and Styles to bring your imagination to life."
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

          {/* Guided Cumulative Creation (tap-first) */}
          <section className="mb-6 sm:mb-8 rounded-2xl border border-[#5BCEFA]/30 bg-[#0A1A3D]/60 p-4 sm:p-6">
            <header className="mb-4">
              <h2 className="font-display text-xl sm:text-2xl text-white">
                Guided Creation
              </h2>
              <p className="text-sm text-[#B8A4E3]">
                Tap to build, name, and claim your creation. Styles and free text are optional.
              </p>
            </header>
            <CreationJourney
              definition={generalCreateDefinition}
              generate={invokeGenerateImage}
            />
          </section>

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
                      Your Creative Studio
                    </SciFiBadge>
                    <p className="text-sm sm:text-base text-foreground/90 max-w-lg">
                      You direct it, step by step — every choice is yours.
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

        </div>
      </main>
      
        {/* Music Player is now rendered globally in App.tsx for seamless playback */}
        {/* Performance Dashboard */}
        {settings.showPerformanceDashboard && <PerformanceDashboard />}
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Onboarding Tour */}
        <CreativeJourneyTour onHighlight={setTourHighlight} />
        
      </div>
      </PullToRefresh>
    </SwipeablePageWrapper>
  );
};

export default CreativeJourney;
