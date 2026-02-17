import { useState, useEffect } from 'react';
import { Sparkles, Edit3, Palette, Wand2, FolderOpen, Download, Star } from 'lucide-react';
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
    title: 'Welcome to Creative Journey! ✨',
    description: 'Create amazing AI-generated images from your imagination. Let\'s learn how to use this powerful tool!',
    icon: Sparkles,
    position: 'center'
  },
  {
    id: 'prompt-input',
    title: 'Write Your Prompt ✏️',
    description: 'Type what you want to create in the text box. Be descriptive! Try "A magical forest with glowing mushrooms".',
    icon: Edit3,
    highlight: 'prompt-input',
    position: 'top'
  },
  {
    id: 'style-presets',
    title: 'Choose a Style 🎨',
    description: 'Pick a style like Cyberpunk, Fantasy, or Anime to change how your image looks. Each style gives a unique artistic feel!',
    icon: Palette,
    highlight: 'style-presets',
    position: 'bottom'
  },
  {
    id: 'generate',
    title: 'Generate Your Image ⚡',
    description: 'Click the "Generate Image" button and watch the AI create your artwork! It usually takes a few seconds.',
    icon: Wand2,
    highlight: 'generate-button',
    position: 'top'
  },
  {
    id: 'output',
    title: 'Your Creation Appears Here! 🖼️',
    description: 'Your generated image will appear in the display area. You can download it, animate it, or regenerate with the same prompt!',
    icon: Download,
    highlight: 'output-area',
    position: 'top'
  },
  {
    id: 'gallery',
    title: 'Save to Your Gallery 📁',
    description: 'All your creations are automatically saved! Click "View Gallery" to see your past images and reuse prompts.',
    icon: FolderOpen,
    highlight: 'gallery-button',
    position: 'center'
  },
  {
    id: 'favorites',
    title: 'Save Your Favorite Prompts ⭐',
    description: 'Like a prompt? Click the star to save it to your favorites. Find them in the "Favorites" category for quick access!',
    icon: Star,
    position: 'center'
  }
];

const STORAGE_KEY = 'creative-journey-tour-completed';

interface CreativeJourneyTourProps {
  onHighlight?: (highlight: string | null) => void;
}

export function CreativeJourneyTour({ onHighlight }: CreativeJourneyTourProps) {
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
      return <TourRestartButton onClick={restartTour} icon={Sparkles} />;
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
        finalButtonText="Let's Create!"
      />
    </>
  );
}
