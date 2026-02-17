import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Users, 
  Palette, 
  Trophy, 
  ArrowRight, 
  ArrowLeft,
  SkipForward,
  PartyPopper,
  Rocket,
  CheckCircle2,
  X,
  Smartphone,
  Download,
  Zap,
  Wifi
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to NexusTouch!',
    description: 'Your AI-powered creative studio awaits. Let\'s personalize your experience.',
    icon: Rocket,
  },
  {
    id: 'interests',
    title: 'Your Creative Interests',
    description: 'What kind of art excites you the most?',
    icon: Palette,
  },
  {
    id: 'personas',
    title: 'Meet Your AI Companions',
    description: 'AI personas will guide your creative journey with unique styles.',
    icon: Users,
  },
  {
    id: 'goals',
    title: 'Set Your Goals',
    description: 'Track achievements and earn rewards as you create.',
    icon: Trophy,
  },
  {
    id: 'install',
    title: 'Make It Yours! 📱',
    description: 'Add NexusTouch to your home screen for quick access anytime!',
    icon: Smartphone,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start creating amazing AI art right now.',
    icon: PartyPopper,
  },
];

const INTEREST_OPTIONS = [
  { id: 'anime', label: 'Anime & Manga', icon: '🎌' },
  { id: 'fantasy', label: 'Fantasy & Sci-Fi', icon: '🐉' },
  { id: 'portraits', label: 'Portraits', icon: '👤' },
  { id: 'landscapes', label: 'Landscapes', icon: '🏔️' },
  { id: 'abstract', label: 'Abstract Art', icon: '🎨' },
  { id: 'gaming', label: 'Gaming Art', icon: '🎮' },
];

const INSTALL_BENEFITS = [
  { icon: Zap, label: 'Launch instantly from your home screen', emoji: '⚡' },
  { icon: Wifi, label: 'Works even without internet', emoji: '📡' },
  { icon: Download, label: 'No app store needed - it\'s free!', emoji: '🆓' },
];

function InstallStepContent() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const haptic = useHapticFeedback();
  const { playSound } = useSoundEffects();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    haptic.trigger('medium');
    installPrompt.prompt();
    
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      haptic.trigger('achievement');
      playSound('celebration');
    }
    setInstallPrompt(null);
  };

  // Detect platform for instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="space-y-4 mb-6">
      {/* Benefits list */}
      <div className="space-y-2">
        {INSTALL_BENEFITS.map((benefit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
          >
            <span className="text-xl">{benefit.emoji}</span>
            <span className="text-sm text-foreground">{benefit.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Install action */}
      {isInstalled ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50"
        >
          <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
          <span className="text-sm font-medium text-neon-cyan">Already installed! 🎉</span>
        </motion.div>
      ) : installPrompt ? (
        <SciFiButton
          variant="primary"
          className="w-full min-h-[48px]"
          onClick={handleInstall}
        >
          <Download className="w-4 h-4 mr-2" />
          Add to Home Screen
        </SciFiButton>
      ) : (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center mb-2">
            {isIOS ? (
              <>Tap <span className="font-bold">Share</span> → <span className="font-bold">Add to Home Screen</span></>
            ) : isAndroid ? (
              <>Tap <span className="font-bold">⋮ Menu</span> → <span className="font-bold">Add to Home Screen</span></>
            ) : (
              <>Look for the install icon in your browser's address bar</>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground/70 text-center">
            You can always do this later from the Install page! 👍
          </p>
        </div>
      )}
    </div>
  );
}

interface WizardProgress {
  currentStep: number;
  selectedInterests: string[];
  lastUpdated: string;
}

const getStorageKey = (userId: string) => `wizard_progress_${userId}`;

export function OnboardingWizard() {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const { playSound } = useSoundEffects();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const step = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Save progress to localStorage whenever step or interests change
  useEffect(() => {
    if (user && isOpen) {
      const progressData: WizardProgress = {
        currentStep,
        selectedInterests,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(getStorageKey(user.id), JSON.stringify(progressData));
    }
  }, [currentStep, selectedInterests, user, isOpen]);

  useEffect(() => {
    if (user && !hasChecked) {
      checkWizardStatus();
    }
  }, [user, hasChecked]);

  const loadSavedProgress = (userId: string) => {
    try {
      const saved = localStorage.getItem(getStorageKey(userId));
      if (saved) {
        const progressData: WizardProgress = JSON.parse(saved);
        // Only restore if saved within last 7 days
        const savedDate = new Date(progressData.lastUpdated);
        const daysSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSave < 7) {
          setCurrentStep(progressData.currentStep);
          setSelectedInterests(progressData.selectedInterests || []);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading wizard progress:', error);
    }
    return false;
  };

  const clearSavedProgress = (userId: string) => {
    localStorage.removeItem(getStorageKey(userId));
  };

  const checkWizardStatus = async () => {
    if (!user) return;
    setHasChecked(true);

    try {
      const { data } = await supabase
        .from('user_onboarding')
        .select('is_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      // Only show wizard for users who haven't completed onboarding
      if (!data || !data.is_complete) {
        // Check localStorage for wizard dismissal
        const wizardDismissed = localStorage.getItem(`wizard_dismissed_${user.id}`);
        if (!wizardDismissed) {
          // Load any saved progress before showing
          loadSavedProgress(user.id);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking wizard status:', error);
    }
  };

  const handleNext = useCallback(() => {
    haptic.trigger('light');
    playSound('stepComplete');
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, haptic, playSound]);

  const handlePrev = useCallback(() => {
    haptic.trigger('light');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, haptic]);

  const handleComplete = async () => {
    haptic.trigger('achievement');
    playSound('celebration');
    
    if (user) {
      // Clear saved progress on completion
      clearSavedProgress(user.id);
      
      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          is_complete: true,
          completed_at: new Date().toISOString(),
          completed_steps: WIZARD_STEPS.map(s => s.id)
        });
    }
    
    setIsOpen(false);
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`wizard_dismissed_${user.id}`, 'true');
    }
    setIsOpen(false);
  };

  const toggleInterest = (id: string) => {
    haptic.trigger('selection');
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="wizard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
            onClick={handleDismiss}
          />

          {/* Wizard Modal */}
          <motion.div
            key="wizard-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-[101] flex items-center justify-center pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg max-h-full overflow-y-auto pointer-events-auto">
              <SciFiFrame glowIntensity="strong" className="p-6 relative">
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  
                  {/* Step indicators */}
                  <div className="flex justify-between mt-3">
                    {WIZARD_STEPS.map((s, i) => (
                      <div
                        key={s.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          i < currentStep 
                            ? 'bg-neon-cyan text-background' 
                            : i === currentStep 
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step content with animation */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
                    >
                      <Icon className="w-8 h-8 text-primary" />
                    </motion.div>

                    {/* Title & Description */}
                    <h2 className="font-display text-2xl font-bold text-center text-foreground mb-2">
                      {step.title}
                    </h2>
                    <p className="text-sm text-center text-muted-foreground mb-6">
                      {step.description}
                    </p>

                    {/* Step-specific content */}
                    {step.id === 'interests' && (
                      <div className="grid grid-cols-2 gap-2 mb-6">
                        {INTEREST_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            onClick={() => toggleInterest(option.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left min-h-[44px] touch-manipulation ${
                              selectedInterests.includes(option.id)
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <span className="text-xl mr-2">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {step.id === 'install' && (
                      <InstallStepContent />
                    )}

                    {step.id === 'complete' && (
                      <div className="flex flex-col items-center gap-4 mb-6">
                        <Sparkles className="w-12 h-12 text-neon-cyan animate-pulse" />
                        <p className="text-center text-sm text-muted-foreground">
                          Your personalized creative journey is ready. Let's make some magic! ✨
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-3 mt-4">
                  {currentStep > 0 && (
                    <SciFiButton
                      variant="ghost"
                      className="flex-1 min-h-[44px] touch-manipulation"
                      onClick={handlePrev}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </SciFiButton>
                  )}
                  
                  {currentStep === 0 && (
                    <SciFiButton
                      variant="ghost"
                      className="flex-1 min-h-[44px] touch-manipulation"
                      onClick={handleDismiss}
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip
                    </SciFiButton>
                  )}
                  
                  <SciFiButton
                    variant="primary"
                    className="flex-1 min-h-[44px] touch-manipulation"
                    onClick={handleNext}
                  >
                    {currentStep === WIZARD_STEPS.length - 1 ? (
                      <>
                        Get Started
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </SciFiButton>
                </div>
              </SciFiFrame>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
