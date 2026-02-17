import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StarfieldBackground from '@/components/StarfieldBackground';
import NexusLogo from '@/components/NexusLogo';
import { SEOHead } from '@/components/SEOHead';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiCard, SciFiCardContent } from '@/components/ui/sci-fi-card';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { SciFiDivider } from '@/components/ui/sci-fi-divider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import mx2kLogo from '@/assets/mx2k-logo-new.png';
import heroAmbientVideo from '@/assets/hero-ambient-video.mp4';
import electricRingEffect from '@/assets/electric-ring-effect.mp4';
import StarfieldOverlay from '@/components/StarfieldOverlay';

import {
  Sparkles, 
  ArrowRight, 
  Zap, 
  Shield, 
  Palette,
  Users,
  Star,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Check,
  Trophy,
  Rocket,
  Heart
} from 'lucide-react';

// Video served from public folder for better audio streaming
const philosopherVideoUrl = '/videos/philosopher-intro.mp4';

const Index = () => {
  const navigate = useNavigate();
  const { settings } = useMotionSettings();
  // Phrases that appear below the video
  const additionalPhrases = [
    "Transform your imagination into stunning visuals",
    "AI-powered image generation at your fingertips",
    "Endless creative possibilities await",
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showRipple, setShowRipple] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Update video volume when volume state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
      // Ensure video is playing after unmuting (browsers may pause muted videos)
      if (volume > 0 && videoRef.current.paused) {
        videoRef.current.play().catch(() => {
          // Autoplay was prevented, this is expected
        });
      }
    }
  }, [volume]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % additionalPhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI Image Generation',
      description: 'Create stunning visuals with cutting-edge AI technology designed for young creators',
    },
    {
      icon: Users,
      title: 'Creative Personas',
      description: 'Design unique character styles that reflect your imagination and artistic vision',
    },
    {
      icon: Palette,
      title: 'Style Presets',
      description: 'Choose from dozens of artistic styles and aesthetics curated for all ages',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate high-quality images in seconds with our optimized AI engine',
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Built with parental controls and content moderation for peace of mind',
    },
    {
      icon: Star,
      title: 'Quest System',
      description: 'Earn rewards, level up, and unlock new creative tools through fun challenges',
    },
  ];

  const testimonials = [
    {
      quote: "My kids absolutely love creating art with NexusTouch. It's safe, fun, and sparks their creativity!",
      author: "Sarah M.",
      role: "Parent of 2",
      rating: 5,
    },
    {
      quote: "I've never felt so creative before. The personas are so cool and the quests keep me coming back!",
      author: "Alex K.",
      role: "Age 14",
      rating: 5,
    },
    {
      quote: "Finally, an AI platform I can trust my children with. The parental controls are excellent.",
      author: "David L.",
      role: "Parent & Educator",
      rating: 5,
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter Universe',
      price: 9,
      credits: 100,
      features: ['100 Monthly Credits', 'Basic Personas', 'Community Access', 'Quest System'],
      popular: false,
    },
    {
      name: 'Stellar Explorer',
      price: 19,
      credits: 500,
      features: ['500 Monthly Credits', 'All Personas', 'HD Quality', 'Priority Generation'],
      popular: true,
    },
    {
      name: 'Cosmic Creator',
      price: 39,
      credits: null,
      features: ['Unlimited Credits', 'All Features', 'Voice Access', 'Exclusive Content'],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead 
        title="NexusTouch - AI Creative Journey"
        description="Transform your imagination into stunning visuals with NexusTouch AI-powered creative platform. Generate images, create personas, and explore endless possibilities."
      />
      <StarfieldBackground />
      
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-cyan/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Navigation */}
      <nav className="relative z-20 container mx-auto px-4 py-4 sm:py-6 safe-top">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <NexusLogo />
            {/* MX2K Branding - hidden on small screens */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-neon-cyan/30 group/mx2k">
              <img 
                src={mx2kLogo} 
                alt="MX2K Logo" 
                className="h-5 lg:h-6 w-auto object-contain transition-transform duration-300 group-hover/mx2k:animate-[flutter_0.4s_ease-in-out_2]"
                style={{
                  transformOrigin: 'center center'
                }}
              />
              <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">
                Powered by <span className="text-neon-cyan">MX2K</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <SciFiButton
              variant="ghost"
              size="sm"
              className="hidden xs:inline-flex sm:size-md"
              onClick={() => navigate('/auth', { state: { mode: 'signin' } })}
            >
              Sign In
            </SciFiButton>
            <SciFiButton
              variant="accent"
              shape="angled"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            >
              Sign Up
            </SciFiButton>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video Introduction */}
      <section className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Video Avatar Introduction - seamlessly blended with starfield */}
          <div className="relative mb-6 sm:mb-8">
            {/* Outer glow that fades into background */}
            <div className="absolute inset-0 mx-auto w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-xl pointer-events-none" />
            
            {/* Video container with blended edges */}
            <div className="relative mx-auto w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-80 md:h-80">
              {/* Background matching layer */}
              <div className="absolute inset-0 rounded-full bg-background" />
              
              {/* Video wrapper */}
              <div className="absolute inset-2 rounded-full overflow-hidden">
                <video
                  ref={videoRef}
                  src={philosopherVideoUrl}
                  autoPlay
                  loop
                  muted={volume === 0}
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlayPause}
                />
                {/* Play/Pause indicator overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  onClick={togglePlayPause}
                >
                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="w-16 h-16 rounded-full bg-background/60 border border-neon-cyan/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                      >
                        <Play className="w-8 h-8 text-neon-cyan ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-neon-cyan/10 pointer-events-none" />
              </div>
              
              {/* Mute/Unmute toggle button - positioned outside overflow container for always-visible accessibility */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <TouchTriggerButton
                    onClick={(e) => {
                      e.stopPropagation();
                      // Trigger ripple effect
                      setShowRipple(true);
                      setTimeout(() => setShowRipple(false), 600);
                      
                      const newVolume = volume === 0 ? 0.7 : 0;
                      setVolume(newVolume);
                      if (videoRef.current) {
                        videoRef.current.muted = newVolume === 0;
                        videoRef.current.volume = newVolume;
                        if (newVolume > 0) {
                          videoRef.current.play().catch(() => {});
                        }
                      }
                    }}
                    className={`absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-space-dark border-2 border-neon-cyan flex items-center justify-center hover:bg-neon-cyan/20 transition-all shadow-[0_0_30px_rgba(0,255,255,0.6),0_0_60px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] z-50 ${volume === 0 ? 'animate-pulse' : ''}`}
                    aria-label={volume === 0 ? "Unmute video" : "Mute video"}
                  >
                    {/* Ripple effect */}
                    <AnimatePresence>
                      {showRipple && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0.8 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-neon-cyan/40 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                    {volume === 0 ? (
                      <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan relative z-10 pointer-events-none" />
                    ) : (
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan relative z-10 pointer-events-none" />
                    )}
                  </TouchTriggerButton>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-background/95 border-neon-cyan/50 text-foreground">
                  <p>{volume === 0 ? "Tap to enable sound" : "Tap to mute"}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Tap for sound label - shows when muted */}
              <AnimatePresence>
                {volume === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute -top-2 -right-16 sm:-top-3 sm:-right-20 z-50 pointer-events-none"
                  >
                    <div className="flex items-center gap-1">
                      <motion.span
                        animate={{ x: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-neon-cyan text-lg"
                      >
                        ←
                      </motion.span>
                      <span className="text-xs font-display text-neon-cyan/90 whitespace-nowrap bg-space-dark/80 px-2 py-1 rounded-full border border-neon-cyan/30">
                        Tap for sound
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Seamless border blend - multiple gradient rings */}
              <div className="absolute inset-0 rounded-full border border-neon-cyan/20 shadow-[0_0_30px_rgba(0,255,255,0.15),inset_0_0_20px_rgba(0,0,0,0.5)]" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-neon-cyan/10 via-transparent to-primary/10 opacity-50 blur-sm pointer-events-none" />
              <div className="absolute -inset-3 rounded-full bg-gradient-radial from-transparent via-transparent to-background pointer-events-none" />
              
              {/* Outer dissolve ring that merges with starfield */}
              <div className="absolute -inset-6 rounded-full bg-gradient-radial from-transparent via-background/30 to-transparent pointer-events-none" />
            </div>
            
            {/* Animated pulsing ring */}
            <div className="absolute inset-0 mx-auto w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full border border-neon-cyan/20 animate-pulse pointer-events-none" />
            
            {/* Outer star-catching glow */}
            <div className="absolute inset-0 mx-auto w-60 h-60 xs:w-72 xs:h-72 sm:w-80 sm:h-80 md:w-[22rem] md:h-[22rem] rounded-full shadow-[0_0_80px_20px_rgba(139,80,255,0.1)] pointer-events-none" />
          </div>
          
          {/* Rotating phrases below video */}
          <div className="h-6 sm:h-8 mb-6 sm:mb-8">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentPhraseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-xs sm:text-sm md:text-base text-muted-foreground italic px-4"
              >
                {additionalPhrases[currentPhraseIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          <SciFiBadge variant="accent" className="mb-6 sm:mb-8 text-xs sm:text-sm">
            <Star className="w-3 h-3 mr-1" />
            Next-Gen AI Creative Platform
          </SciFiBadge>
          
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2 relative z-10">
            Unleash Your <br className="hidden sm:block" />
            <span className="text-gradient">Creative Journey</span>
          </h1>

          {/* Ambient Logo Video with Electric Ring - centered between title and button */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto mt-8 sm:mt-10 md:mt-12 mb-8 sm:mb-10 md:mb-12">
            {/* Outer glow behind video */}
            <div className="absolute -inset-8 bg-primary/15 rounded-full blur-[50px] animate-pulse pointer-events-none" />
            <div className="absolute -inset-12 bg-neon-cyan/10 rounded-full blur-[60px] animate-pulse pointer-events-none" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
            
            {/* Electric ring video effect - circular mask to eliminate black borders */}
            <div 
              className="absolute -inset-20 sm:-inset-24 md:-inset-28 pointer-events-none overflow-hidden"
              style={{
                mask: 'radial-gradient(circle at 50% 50%, black 0%, black 38%, transparent 52%)',
                WebkitMask: 'radial-gradient(circle at 50% 50%, black 0%, black 38%, transparent 52%)',
              }}
            >
              <video
                src={electricRingEffect}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-[2.2]"
                style={{
                  mixBlendMode: 'screen',
                  // Removed hue-rotate to ensure consistent colors across devices
                  filter: 'saturate(0.7) brightness(1.1) contrast(1.05)',
                  opacity: 0.6,
                  willChange: 'transform',
                }}
              />
              
              {/* Starfield overlay on top of the animation */}
              <StarfieldOverlay className="z-10" />
            </div>
            
            {/* Video container clipped to circle */}
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <video
                src={heroAmbientVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{
                  mixBlendMode: 'screen',
                  filter: 'saturate(1.3) brightness(1.1)',
                  willChange: 'transform',
                }}
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
            </div>
            
            {/* Soft glow */}
            <div 
              className="absolute -inset-4 rounded-full pointer-events-none animate-pulse"
              style={{ 
                background: 'radial-gradient(circle at 50% 50%, transparent 35%, hsl(var(--primary) / 0.08) 55%, hsl(var(--neon-cyan) / 0.06) 75%, transparent 100%)',
                filter: 'blur(15px)',
                mixBlendMode: 'screen'
              }}
            />
            
            {/* Soft outer glow */}
            <div className="absolute -inset-2 rounded-full shadow-[0_0_30px_10px_hsl(var(--primary)/0.1),0_0_60px_20px_hsl(var(--neon-cyan)/0.05)] pointer-events-none" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/auth">
              <SciFiButton variant="primary" size="xl" shape="angled" className="gap-2 group">
                Start Creating
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </SciFiButton>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 px-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="w-7 h-7 sm:w-8 sm:h-8 border border-neon-cyan/50 bg-neon-cyan/10 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-cyan" />
              </div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="w-7 h-7 sm:w-8 sm:h-8 border border-neon-cyan/50 bg-neon-cyan/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-cyan" />
              </div>
              <span>5 Free Credits</span>
            </div>
          </div>
        </div>
      </section>

      <SciFiDivider variant="decorated" className="container mx-auto" />

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Powerful Features
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Everything you need to bring your creative vision to life
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <SciFiCard variant="default" animated className="text-center h-full">
                  <SciFiCardContent className="p-4 sm:p-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-2 border-neon-cyan/50 bg-neon-cyan/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-neon-cyan" />
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </SciFiCardContent>
                </SciFiCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      <SciFiDivider variant="decorated" className="container mx-auto" />

      {/* Testimonials Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <SciFiBadge variant="default" className="mb-4">
            <Heart className="w-3 h-3 mr-1" />
            Trusted by Families
          </SciFiBadge>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            What Creators Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <SciFiCard variant="default" className="h-full">
                <SciFiCardContent className="p-4 sm:p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-neon-magenta fill-neon-magenta" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-foreground/90 mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </SciFiCardContent>
              </SciFiCard>
            </motion.div>
          ))}
        </div>
      </section>

      <SciFiDivider variant="decorated" className="container mx-auto" />

      {/* Pricing Preview Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <SciFiBadge variant="accent" className="mb-4">
            <Rocket className="w-3 h-3 mr-1" />
            Simple Pricing
          </SciFiBadge>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Choose Your Creative Tier
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Start free with 5 credits. Upgrade anytime to unlock more creative power.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <SciFiBadge variant="accent" className="text-[10px]">
                    <Trophy className="w-3 h-3 mr-1" />
                    Most Popular
                  </SciFiBadge>
                </div>
              )}
              <SciFiCard 
                variant={tier.popular ? "gradient" : "default"} 
                className={`h-full ${tier.popular ? 'border-2 border-neon-cyan' : ''}`}
              >
                <SciFiCardContent className="p-4 sm:p-6 text-center">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl sm:text-4xl font-bold text-gradient">${tier.price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <div className="text-sm text-neon-cyan mb-4">
                    {tier.credits ? `${tier.credits} Credits` : 'Unlimited Credits'}
                  </div>
                  <ul className="space-y-2 mb-6 text-left">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <SciFiButton
                    variant={tier.popular ? "primary" : "ghost"}
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/auth')}
                  >
                    Get Started
                  </SciFiButton>
                </SciFiCardContent>
              </SciFiCard>
            </motion.div>
          ))}
        </div>
      </section>

      <SciFiDivider variant="decorated" className="container mx-auto" />

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <SciFiFrame 
          glowIntensity="medium" 
          animated 
          className="p-6 sm:p-8 md:p-12 text-center"
        >
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Ready to Start Your Creative Journey?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto px-4">
            Join thousands of families already using NexusTouch to spark creativity and imagination.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <SciFiButton
              variant="primary"
              size="lg"
              shape="angled"
              className="gap-2 group"
              onClick={() => navigate('/auth')}
            >
              Start Creating Free
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </SciFiButton>
            <SciFiButton
              variant="ghost"
              size="lg"
              className="gap-2"
              onClick={() => navigate('/feedback')}
            >
              Share Your Feedback
              <ArrowRight className="w-4 h-4" />
            </SciFiButton>
          </div>
        </SciFiFrame>
      </section>

      {/* Performance Dashboard - Controlled by settings */}
      {settings.showPerformanceDashboard && <PerformanceDashboard />}

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-neon-cyan/20 py-6 sm:py-8 safe-bottom">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <NexusLogo size="sm" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/feedback" className="hover:text-neon-cyan transition-colors">Feedback</Link>
              <Link to="/auth" className="hover:text-neon-cyan transition-colors">Sign In</Link>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-display uppercase tracking-wider text-center">
              © 2024 NexusTouch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
