import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { OnboardingMascot } from './OnboardingMascot';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Users, 
  Palette, 
  Trophy, 
  ArrowRight, 
  SkipForward,
  PartyPopper,
  Rocket
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  message: string;
  mascotMessage: string;
  targetRoute?: string;
  targetSelector?: string;
  icon: React.ComponentType<{ className?: string }>;
  audience: 'young' | 'adult' | 'all';
  emotion: 'happy' | 'excited' | 'thinking' | 'waving';
}

const YOUNG_EXPLORER_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome, Young Explorer! 🚀',
    message: 'Are you ready for an amazing adventure? I\'ll be your guide through the cosmos of creativity!',
    mascotMessage: 'Hi there! I\'m so excited to meet you! Let\'s go on an adventure together! 🌟',
    icon: Rocket,
    audience: 'young',
    emotion: 'waving'
  },
  {
    id: 'create',
    title: 'Create Magic! ✨',
    message: 'This is where the magic happens! Just tell me what you want to see, and I\'ll help you create amazing pictures!',
    mascotMessage: 'Want to see a dragon in space? A rainbow castle? Just ask, and I\'ll help you make it real!',
    targetRoute: '/creative-journey',
    icon: Sparkles,
    audience: 'young',
    emotion: 'excited'
  },
  {
    id: 'personas',
    title: 'Meet Your Friends! 🤖',
    message: 'These are my friends! Each one has special powers to help you create different kinds of art!',
    mascotMessage: 'Some of my friends love anime, others love sci-fi. Pick your favorite to be your art buddy!',
    targetRoute: '/personas',
    icon: Users,
    audience: 'young',
    emotion: 'happy'
  },
  {
    id: 'achievements',
    title: 'Earn Cool Badges! 🏆',
    message: 'Every time you create something awesome, you can earn special badges and unlock new powers!',
    mascotMessage: 'I bet you\'ll collect them all! Each badge means you\'re becoming an even better artist!',
    targetRoute: '/dashboard',
    icon: Trophy,
    audience: 'young',
    emotion: 'excited'
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
    message: 'That\'s it! You\'re now a certified NexusTouch Explorer! Go create something amazing!',
    mascotMessage: 'Woohoo! I can\'t wait to see what you create! Remember, I\'m always here to help!',
    icon: PartyPopper,
    audience: 'young',
    emotion: 'excited'
  }
];

const ADULT_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to NexusTouch',
    message: 'Your AI-powered creative studio. Let me show you around.',
    mascotMessage: 'Welcome! I\'ll give you a quick overview of the key features.',
    icon: Rocket,
    audience: 'adult',
    emotion: 'happy'
  },
  {
    id: 'create',
    title: 'Creative Journey',
    message: 'Generate stunning AI artwork using natural language prompts. Supports multiple styles and reference images.',
    mascotMessage: 'Pro tip: Detailed prompts with lighting and mood descriptions yield better results.',
    targetRoute: '/creative-journey',
    icon: Sparkles,
    audience: 'adult',
    emotion: 'thinking'
  },
  {
    id: 'personas',
    title: 'AI Personas',
    message: 'Choose different AI personas to influence your art style. Each persona has unique characteristics.',
    mascotMessage: 'Personas affect the artistic interpretation. Experiment to find your preferred style.',
    targetRoute: '/personas',
    icon: Users,
    audience: 'adult',
    emotion: 'happy'
  },
  {
    id: 'community',
    title: 'Community & Sharing',
    message: 'Share your creations, follow other artists, and discover inspiring work from the community.',
    mascotMessage: 'Making creations public helps you build a following and earn recognition.',
    targetRoute: '/community',
    icon: Palette,
    audience: 'adult',
    emotion: 'happy'
  },
  {
    id: 'complete',
    title: 'You\'re All Set',
    message: 'You\'re ready to start creating. Explore the dashboard to track your progress.',
    mascotMessage: 'Feel free to ask if you need any help. Happy creating!',
    icon: PartyPopper,
    audience: 'adult',
    emotion: 'waving'
  }
];

interface OnboardingTourProps {
  audienceType?: 'young_explorer' | 'adult';
}

export function OnboardingTour({ audienceType = 'young_explorer' }: OnboardingTourProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { playSound } = useSoundEffects();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps = audienceType === 'young_explorer' ? YOUNG_EXPLORER_STEPS : ADULT_STEPS;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // New user - start onboarding
        await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            audience_type: audienceType,
            completed_steps: []
          });
        setIsActive(true);
      } else if (!data.is_complete) {
        setCompletedSteps(data.completed_steps || []);
        const lastCompletedIndex = (data.completed_steps || []).length;
        setCurrentStep(Math.min(lastCompletedIndex, steps.length - 1));
        setIsActive(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleNext = useCallback(async () => {
    haptic.trigger('tour-step');
    playSound('stepComplete');
    
    const stepId = step.id;
    const newCompletedSteps = [...completedSteps, stepId];
    setCompletedSteps(newCompletedSteps);

    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep + 1];
      
      // Navigate if needed
      if (nextStep.targetRoute && location.pathname !== nextStep.targetRoute) {
        playSound('whoosh');
        haptic.trigger('navigation');
        navigate(nextStep.targetRoute);
      }
      
      setCurrentStep(prev => prev + 1);
      
      // Save progress
      if (user) {
        await supabase
          .from('user_onboarding')
          .update({ completed_steps: newCompletedSteps })
          .eq('user_id', user.id);
      }
    } else {
      // Complete onboarding
      haptic.trigger('achievement');
      playSound('celebration');
      if (user) {
        await supabase
          .from('user_onboarding')
          .update({ 
            is_complete: true, 
            completed_at: new Date().toISOString(),
            completed_steps: newCompletedSteps
          })
          .eq('user_id', user.id);
      }
      setIsActive(false);
    }
  }, [currentStep, step, steps, completedSteps, user, navigate, location, haptic, playSound]);

  const handleSkip = useCallback(async () => {
    haptic.trigger('light');
    if (user) {
      await supabase
        .from('user_onboarding')
        .update({ is_complete: true, completed_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }
    setIsActive(false);
  }, [user, haptic]);

  if (!isActive) return null;

  const Icon = step.icon;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
      />

      {/* Tour Card - Responsive positioning */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[calc(100vw-24px)] sm:max-w-md px-3 sm:px-4"
        >
          <SciFiFrame glowIntensity="strong" className="p-4 sm:p-6">
            {/* Progress Bar */}
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5 sm:h-2" />
            </div>

            {/* Icon */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-2 border-neon-cyan bg-neon-cyan/10 flex items-center justify-center">
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-neon-cyan" />
            </div>

            {/* Title */}
            <h2 className="font-display text-lg sm:text-xl font-bold text-center text-foreground mb-2 sm:mb-3">
              {step.title}
            </h2>

            {/* Message */}
            <p className="text-xs sm:text-sm text-center text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              {step.message}
            </p>

            {/* Actions - Touch-friendly sizing */}
            <div className="flex gap-2 sm:gap-3">
              <SciFiButton
                variant="ghost"
                className="flex-1 min-h-[44px] touch-manipulation"
                onClick={handleSkip}
              >
                <SkipForward className="w-4 h-4 mr-1 sm:mr-2" />
                Skip
              </SciFiButton>
              <SciFiButton
                variant="primary"
                className="flex-1 min-h-[44px] touch-manipulation"
                onClick={handleNext}
              >
                {currentStep === steps.length - 1 ? 'Start!' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
              </SciFiButton>
            </div>
          </SciFiFrame>
        </motion.div>
      </AnimatePresence>

      {/* Mascot - Responsive positioning */}
      <OnboardingMascot
        message={step.mascotMessage}
        isVisible={true}
        emotion={step.emotion}
        position="left"
      />
    </>
  );
}