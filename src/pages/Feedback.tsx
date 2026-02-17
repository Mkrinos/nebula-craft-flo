import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import StarfieldBackground from '@/components/StarfieldBackground';
import { SciFiCard, SciFiCardContent, SciFiCardHeader } from '@/components/ui/sci-fi-card';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiProgress } from '@/components/ui/sci-fi-progress';
import { Rocket, Gamepad2, Users, MessageSquare, Star, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import YoungExplorerForm from '@/components/feedback/YoungExplorerForm';
import ParentGuardianForm from '@/components/feedback/ParentGuardianForm';
import { BackButton } from '@/components/BackButton';

type FeedbackView = 'selection' | 'young-explorer' | 'parent-guardian';

const Feedback = () => {
  const [currentView, setCurrentView] = useState<FeedbackView>('selection');

  const renderContent = () => {
    switch (currentView) {
      case 'young-explorer':
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <YoungExplorerForm onBack={() => setCurrentView('selection')} />
          </motion.div>
        );
      case 'parent-guardian':
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <ParentGuardianForm onBack={() => setCurrentView('selection')} />
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Back Button */}
            <div className="mb-6">
              <BackButton />
            </div>
            
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 border border-neon-cyan/30 bg-neon-cyan/5 rounded-full">
                <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
                <span className="text-xs sm:text-sm text-neon-cyan font-display uppercase tracking-wider">
                  Your Voice Matters!
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground">
                Help Us Build the Future Together! 
                <span className="inline-block ml-2 animate-bounce">🚀</span>
              </h1>
              
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Every idea makes us better! Share your thoughts and help shape the next generation of creative experiences.
              </p>
            </motion.div>

            {/* Feedback Stats Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-10 sm:mb-14"
            >
              <SciFiPanel variant="default" title="Community Impact">
                <div className="grid grid-cols-3 gap-4 sm:gap-6 p-4">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-neon-cyan mb-1">247</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Ideas Shared</div>
                  </div>
                  <div className="text-center border-x border-neon-cyan/20">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-primary mb-1">89</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Implemented</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-accent mb-1">36%</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Success Rate</div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <SciFiProgress value={36} max={100} variant="gradient" size="md" showValue label="Ideas → Features" />
                </div>
              </SciFiPanel>
            </motion.div>

            {/* Feedback Pathway Cards */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Young Explorer Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <SciFiCard 
                  variant="default" 
                  headerLabel="EXPLORERS" 
                  cornerAccents 
                  animated
                  className="h-full"
                >
                  <SciFiCardHeader className="pt-6 pb-4 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-2xl bg-primary/10 border-2 border-primary/30">
                      <span className="text-4xl sm:text-5xl">🎮</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
                      Young Explorer Feedback
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                      <Star className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary font-medium">Ages 10-16</span>
                    </div>
                  </SciFiCardHeader>
                  
                  <SciFiCardContent className="px-6 pb-6">
                    <p className="text-muted-foreground text-center mb-6">
                      Share your awesome ideas and experiences! Tell us what makes creating fun and what cool features you&apos;d love to see.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {['Fun Ideas', 'Cool Features', 'Easy to Use'].map((tag) => (
                        <span 
                          key={tag}
                          className="px-3 py-1 text-xs bg-space-elevated border border-primary/20 rounded-full text-foreground/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <SciFiButton 
                      variant="primary" 
                      className="w-full min-h-[60px] text-base font-display"
                      onClick={() => setCurrentView('young-explorer')}
                    >
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      Start Feedback
                    </SciFiButton>
                  </SciFiCardContent>
                </SciFiCard>
              </motion.div>

              {/* Parent/Guardian Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <SciFiCard 
                  variant="default" 
                  headerLabel="GUARDIANS" 
                  cornerAccents 
                  animated
                  className="h-full"
                >
                  <SciFiCardHeader className="pt-6 pb-4 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-2xl bg-accent/10 border-2 border-accent/30">
                      <span className="text-4xl sm:text-5xl">👥</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
                      Parent/Guardian Feedback
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full">
                      <Heart className="w-3 h-3 text-accent" />
                      <span className="text-xs text-accent font-medium">Adults</span>
                    </div>
                  </SciFiCardHeader>
                  
                  <SciFiCardContent className="px-6 pb-6">
                    <p className="text-muted-foreground text-center mb-6">
                      Help us create a safe, valuable experience for young creators. Your insights ensure we build something truly special.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {['Safety', 'Value', 'Trust'].map((tag) => (
                        <span 
                          key={tag}
                          className="px-3 py-1 text-xs bg-space-elevated border border-accent/20 rounded-full text-foreground/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <SciFiButton 
                      variant="accent" 
                      className="w-full min-h-[60px] text-base font-display"
                      onClick={() => setCurrentView('parent-guardian')}
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Provide Feedback
                    </SciFiButton>
                  </SciFiCardContent>
                </SciFiCard>
              </motion.div>
            </div>

            {/* Motivational Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-10 sm:mt-14"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 border border-border/50 bg-space-elevated/30 rounded-full">
                <MessageSquare className="w-4 h-4 text-neon-cyan" />
                <span className="text-sm text-muted-foreground">
                  Every piece of feedback helps us improve!
                </span>
                <Rocket className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <SwipeablePageWrapper>
      <div className="min-h-screen bg-space-dark">
        <StarfieldBackground />
        <Navigation />
      <main className="relative z-10 pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>
      
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SwipeablePageWrapper>
  );
};

export default Feedback;
