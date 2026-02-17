import { useState, useEffect } from 'react';
import { Home, Edit3, Palette, Unlock, MousePointer, Eye, Gift } from 'lucide-react';
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
    title: 'Welcome to World Building! 🏠',
    description: 'Create and customize your own creative studio space. Earn decorations from quests and achievements!',
    icon: Home,
    position: 'center'
  },
  {
    id: 'edit-mode',
    title: 'Enter Edit Mode ✏️',
    description: 'Click the "Edit Mode" button to start decorating your studio. This lets you place and remove decorations.',
    icon: Edit3,
    highlight: 'edit-button',
    position: 'top'
  },
  {
    id: 'select-decoration',
    title: 'Choose Decorations 🎨',
    description: 'Go to the "Decor" tab to see your unlocked decorations. Click one to select it for placement.',
    icon: Palette,
    highlight: 'decor-tab',
    position: 'bottom'
  },
  {
    id: 'place-decoration',
    title: 'Place in Your Studio 📍',
    description: 'With a decoration selected, click anywhere in your studio space above to place it. Click again to place more!',
    icon: MousePointer,
    highlight: 'studio-viewer',
    position: 'top'
  },
  {
    id: 'view-mode',
    title: 'Switch to View Mode 👁️',
    description: 'When you\'re done decorating, click "View Mode" to see your studio without the editing controls.',
    icon: Eye,
    position: 'center'
  },
  {
    id: 'unlock-studios',
    title: 'Unlock New Studios 🔓',
    description: 'Check the "Studios" tab to see all available spaces. Complete quests and achievements to unlock more!',
    icon: Unlock,
    highlight: 'studios-tab',
    position: 'bottom'
  },
  {
    id: 'earn-rewards',
    title: 'Earn Rewards! 🎁',
    description: 'Visit the Shop, complete Events, and climb the Leaderboard to earn exclusive decorations and recognition!',
    icon: Gift,
    position: 'center'
  }
];

const STORAGE_KEY = 'worldbuilding-tour-completed';

interface WorldBuildingTourProps {
  onHighlight?: (highlight: string | null) => void;
}

export function WorldBuildingTour({ onHighlight }: WorldBuildingTourProps) {
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

  useEffect(() => {
    if (isActive) {
      onHighlight?.(TOUR_STEPS[currentStep].highlight || null);
    } else {
      onHighlight?.(null);
    }
  }, [isActive, currentStep, onHighlight]);

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
      return <TourRestartButton onClick={restartTour} icon={Home} />;
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
        finalButtonText="Done!"
      />
    </>
  );
}
