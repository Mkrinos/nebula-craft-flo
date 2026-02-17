import { useState, useEffect } from 'react';
import { LayoutDashboard, Settings2, Sparkles, Trophy, Users, Scroll } from 'lucide-react';
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
    title: 'Welcome to Your Dashboard! 🚀',
    description: 'This is your creative command center. See your stats, start quests, and track your progress all in one place.',
    icon: LayoutDashboard,
    position: 'center'
  },
  {
    id: 'customize',
    title: 'Customize Your Space ⚙️',
    description: 'Click "Customize" to rearrange widgets, hide ones you don\'t need, or add new ones. Make this dashboard yours!',
    icon: Settings2,
    position: 'top'
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions ⚡',
    description: 'Jump straight into creating images, exploring quests, or visiting your studio with one click.',
    icon: Sparkles,
    position: 'bottom'
  },
  {
    id: 'quests',
    title: 'Track Your Quests 📜',
    description: 'See your active quests right here. Complete them to earn credits, XP, and unlock special rewards!',
    icon: Scroll,
    position: 'bottom'
  },
  {
    id: 'creators',
    title: 'Connect with Creators 👥',
    description: 'Discover top creators in the community. Follow them to see their latest work and get inspired!',
    icon: Users,
    position: 'bottom'
  },
  {
    id: 'achievements',
    title: 'Celebrate Your Wins! 🏆',
    description: 'Your achievements are displayed at the bottom. Keep creating to unlock more badges and rewards!',
    icon: Trophy,
    position: 'center'
  }
];

const STORAGE_KEY = 'dashboard-tour-completed';

export function DashboardTour() {
  const haptic = useHapticFeedback();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTour(false);
      const timer = setTimeout(() => setIsActive(true), 1500);
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
      return <TourRestartButton onClick={restartTour} icon={LayoutDashboard} />;
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
        finalButtonText="Get Started!"
      />
    </>
  );
}
