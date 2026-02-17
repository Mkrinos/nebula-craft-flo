import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Check, Share, Plus, MoreVertical, ArrowRight, Sparkles } from 'lucide-react';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiCard, SciFiCardContent } from '@/components/ui/sci-fi-card';
import { SEOHead } from '@/components/SEOHead';
import { BackButton } from '@/components/BackButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const haptic = useHapticFeedback();

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      haptic.trigger('success');
      toast.success('NexusTouch installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [haptic]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    haptic.trigger('medium');
    await deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const iosSteps = [
    { icon: Share, text: 'Tap the Share button', subtext: 'at the bottom of Safari' },
    { icon: Plus, text: 'Tap "Add to Home Screen"', subtext: 'scroll down in the menu' },
    { icon: Check, text: 'Tap "Add" to confirm', subtext: 'the app icon will appear on your home screen' },
  ];

  const androidSteps = [
    { icon: MoreVertical, text: 'Tap the menu button', subtext: 'three dots in Chrome' },
    { icon: Download, text: 'Tap "Install app"', subtext: 'or "Add to Home Screen"' },
    { icon: Check, text: 'Tap "Install" to confirm', subtext: 'the app will be added' },
  ];

  if (isStandalone) {
    return (
      <>
        <SEOHead 
          title="Already Installed | NexusTouch"
          description="NexusTouch is already installed on your device."
        />
        <div className="min-h-screen flex items-center justify-center p-4 bg-space-dark">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <SciFiFrame className="inline-block p-8 mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-500" />
              </div>
            </SciFiFrame>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Already Installed!
            </h1>
            <p className="text-muted-foreground mb-6">
              You're using NexusTouch as an installed app.
            </p>
            <SciFiButton onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </SciFiButton>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Install NexusTouch | Add to Home Screen"
        description="Install NexusTouch on your device for the best experience. Works offline, loads instantly, and feels like a native app."
      />
      
      <div className="min-h-screen bg-space-dark">
        <div className="container max-w-2xl mx-auto px-4 py-8 safe-top safe-bottom">
          <BackButton />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-primary/20 border border-neon-cyan/50 mb-6 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
              <Smartphone className="w-10 h-10 text-neon-cyan" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
              Install <span className="text-neon-cyan">NexusTouch</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add NexusTouch to your home screen for instant access, offline support, and a native app experience.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {[
              { icon: '⚡', label: 'Instant Load' },
              { icon: '📴', label: 'Works Offline' },
              { icon: '🎨', label: 'Full Screen' },
            ].map((benefit, i) => (
              <SciFiCard key={i} variant="elevated" className="p-3 text-center">
                <span className="text-2xl mb-1 block">{benefit.icon}</span>
                <span className="text-xs text-muted-foreground">{benefit.label}</span>
              </SciFiCard>
            ))}
          </motion.div>

          {/* Install prompt for supported browsers */}
          <AnimatePresence mode="wait">
            {deferredPrompt && !isInstalled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8"
              >
                <SciFiFrame variant="accent" className="p-6 text-center">
                  <Sparkles className="w-8 h-8 text-neon-cyan mx-auto mb-4" />
                  <h2 className="text-xl font-display font-bold mb-2">Ready to Install!</h2>
                  <p className="text-muted-foreground mb-4">
                    Click below to add NexusTouch to your home screen.
                  </p>
                  <SciFiButton 
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Install NexusTouch
                  </SciFiButton>
                </SciFiFrame>
              </motion.div>
            )}

            {isInstalled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
              >
                <SciFiFrame variant="success" className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-2 text-green-400">
                    Installation Complete!
                  </h2>
                  <p className="text-muted-foreground">
                    NexusTouch has been added to your home screen.
                  </p>
                </SciFiFrame>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual instructions for iOS */}
          {isIOS && !deferredPrompt && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SciFiCard className="p-6">
                <SciFiCardContent>
                  <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🍎</span>
                    Install on iPhone/iPad
                  </h2>
                  <div className="space-y-4">
                    {iosSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
                            <span className="text-neon-cyan font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-neon-cyan" />
                              <span className="font-medium">{step.text}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.subtext}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SciFiCardContent>
              </SciFiCard>
            </motion.div>
          )}

          {/* Manual instructions for Android (fallback) */}
          {isAndroid && !deferredPrompt && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SciFiCard className="p-6">
                <SciFiCardContent>
                  <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    Install on Android
                  </h2>
                  <div className="space-y-4">
                    {androidSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
                            <span className="text-neon-cyan font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-neon-cyan" />
                              <span className="font-medium">{step.text}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.subtext}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SciFiCardContent>
              </SciFiCard>
            </motion.div>
          )}

          {/* Desktop fallback */}
          {!isIOS && !isAndroid && !deferredPrompt && !isInstalled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SciFiCard className="p-6 text-center">
                <SciFiCardContent>
                  <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-lg font-display font-bold mb-2">
                    Visit on Mobile
                  </h2>
                  <p className="text-muted-foreground">
                    Open this page on your phone or tablet to install NexusTouch as an app.
                  </p>
                </SciFiCardContent>
              </SciFiCard>
            </motion.div>
          )}

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h3 className="text-sm font-display uppercase tracking-wider text-muted-foreground mb-4 text-center">
              What you get
            </h3>
            <div className="grid gap-3">
              {[
                { emoji: '🚀', text: 'Launch instantly from your home screen' },
                { emoji: '📴', text: 'Use offline - no internet required' },
                { emoji: '🔔', text: 'Get notifications for achievements and quests' },
                { emoji: '🎨', text: 'Full-screen immersive experience' },
                { emoji: '💾', text: 'Your creations saved locally' },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-space-elevated/50 border border-border/30"
                >
                  <span className="text-xl">{feature.emoji}</span>
                  <span className="text-sm text-foreground/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
