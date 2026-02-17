import { useState, useEffect } from 'react';
import { Scroll, Clock, Flame, Star, Trophy, Gift } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { 
  ResponsiveTourCard, 
  TourBackdrop, 
  TourRestartButton,
  type TourStep 
} from '@/components/ui/ResponsiveTourCard';

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Quests! 📜',
    description: 'Complete creative challenges to earn credits, XP, and unlock exclusive rewards. Your adventure starts here!',
    icon: Scroll,
    position: 'center'
  },
  {
    id: 'daily',
    title: 'Daily Quests ⏰',
    description: 'Fresh quests every day! These are quick tasks you can complete in a single session. Great for daily practice!',
    icon: Clock,
    position: 'top'
  },
  {
    id: 'weekly',
    title: 'Weekly Challenges 🔥',
    description: 'Bigger goals with better rewards! Weekly quests give you time to really explore and create amazing work.',
    icon: Flame,
    position: 'top'
  },
  {
    id: 'story',
    title: 'Story Quests ⭐',
    description: 'Epic progression quests that tell your creative story. Complete these to unlock special personas and studios!',
    icon: Star,
    position: 'top'
  },
  {
    id: 'level',
    title: 'Level Up! 🏆',
    description: 'Earn XP from every quest you complete. Watch your level grow and unlock new abilities along the way!',
    icon: Trophy,
    position: 'bottom'
  },
  {
    id: 'rewards',
    title: 'Claim Your Rewards! 🎁',
    description: 'Completed a quest? Don\'t forget to claim your rewards! Credits, XP, and special unlocks await.',
    icon: Gift,
    position: 'center'
  }
];

const STORAGE_KEY = 'quests-tour-completed';

export function QuestsTour() {
  const haptic = useHapticFeedback();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTour(false);
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    haptic.trigger('tour-step');
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    haptic.trigger('light');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTour = () => {
    haptic.trigger('success');
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsActive(false);
    setHasSeenTour(true);
  };

  const handleSkip = () => {
    haptic.trigger('light');
    completeTour();
  };

  const restartTour = () => {
    haptic.trigger('selection');
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) {
    if (hasSeenTour) {
      return <TourRestartButton onClick={restartTour} icon={Scroll} />;
    }
    return null;
  }

  return (
    <>
      <TourBackdrop onClose={handleSkip} />
      <ResponsiveTourCard
        step={TOUR_STEPS[currentStep]}
        steps={TOUR_STEPS}
        currentStep={currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        finalButtonText="Start Questing!"
      />
    </>
  );
}
