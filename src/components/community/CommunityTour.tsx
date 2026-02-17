import { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2,
  TrendingUp,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { 
  ResponsiveTourCard, 
  TourBackdrop, 
  TourRestartButton,
  type TourStep 
} from '@/components/ui/ResponsiveTourCard';

// Create wrapper icons to match TourStep interface
const UsersIcon = ({ className }: { className?: string }) => <Users className={className} />;
const TrendingUpIcon = ({ className }: { className?: string }) => <TrendingUp className={className} />;
const SparklesIcon = ({ className }: { className?: string }) => <Sparkles className={className} />;
const HeartIcon = ({ className }: { className?: string }) => <Heart className={className} />;
const MessageCircleIcon = ({ className }: { className?: string }) => <MessageCircle className={className} />;
const UserPlusIcon = ({ className }: { className?: string }) => <UserPlus className={className} />;
const Share2Icon = ({ className }: { className?: string }) => <Share2 className={className} />;

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the Community! 🌟',
    description: 'Discover amazing AI art from fellow creators, share your own creations, and make new friends!',
    icon: UsersIcon,
    position: 'center'
  },
  {
    id: 'discover',
    title: 'Discover Amazing Art',
    description: 'The "Discover" tab shows the latest public creations from all creators. Browse, like, and find inspiration!',
    icon: TrendingUpIcon,
    highlight: 'discover-tab',
    position: 'top'
  },
  {
    id: 'following',
    title: 'Your Personal Feed',
    description: 'The "Following" tab shows creations only from creators you follow. Build your own curated art feed!',
    icon: UsersIcon,
    highlight: 'following-tab',
    position: 'top'
  },
  {
    id: 'creators',
    title: 'Find Amazing Creators',
    description: 'The "Creators" tab shows top artists in our community. Follow them to see their work in your feed!',
    icon: SparklesIcon,
    highlight: 'creators-tab',
    position: 'top'
  },
  {
    id: 'like',
    title: 'Show Some Love ❤️',
    description: 'Tap the heart icon on any image to like it. Creators love seeing appreciation for their work!',
    icon: HeartIcon,
    position: 'center'
  },
  {
    id: 'comment',
    title: 'Leave Kind Comments',
    description: 'Click on any image to view it and leave a friendly comment. Our AI ensures all comments are positive and safe!',
    icon: MessageCircleIcon,
    position: 'center'
  },
  {
    id: 'follow',
    title: 'Follow Creators',
    description: 'Use the follow button to add creators to your feed. You\'ll see their new creations whenever they share!',
    icon: UserPlusIcon,
    position: 'center'
  },
  {
    id: 'share',
    title: 'Share Creations',
    description: 'Use the share button to show amazing art to friends and family. Spread the creativity!',
    icon: Share2Icon,
    position: 'center'
  }
];

interface CommunityTourProps {
  onHighlight?: (elementId: string | null) => void;
}

export function CommunityTour({ onHighlight }: CommunityTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const { playSound } = useSoundEffects();
  const haptic = useHapticFeedback();

  useEffect(() => {
    const seen = localStorage.getItem('community-tour-completed');
    if (!seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        playSound('ding');
        haptic.trigger('tour-step');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && tourSteps[currentStep]?.highlight) {
      onHighlight?.(tourSteps[currentStep].highlight!);
    } else {
      onHighlight?.(null);
    }
  }, [currentStep, isOpen, onHighlight]);

  const handleNext = () => {
    playSound('pop');
    haptic.trigger('tour-step');
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    playSound('pop');
    haptic.trigger('light');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTour = () => {
    playSound('celebration');
    haptic.trigger('success');
    localStorage.setItem('community-tour-completed', 'true');
    setIsOpen(false);
    setHasSeenTour(true);
    onHighlight?.(null);
  };

  const restartTour = () => {
    playSound('pop');
    haptic.trigger('selection');
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    if (hasSeenTour) {
      return <TourRestartButton onClick={restartTour} icon={RotateCcw} position="bottom-left" />;
    }
    return null;
  }

  return (
    <>
      <TourBackdrop onClose={completeTour} />
      <ResponsiveTourCard
        step={tourSteps[currentStep]}
        steps={tourSteps}
        currentStep={currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={completeTour}
        finalButtonText="Start Exploring!"
      />
    </>
  );
}
