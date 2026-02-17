import React, { createContext, useContext, useRef, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigationType, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { SwipeBackIndicator } from '@/components/SwipeBackIndicator';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import CreativeJourney from '@/pages/CreativeJourney';
import Personas from '@/pages/Personas';
import Billing from '@/pages/Billing';
import Feedback from '@/pages/Feedback';
import GenerationHistory from '@/pages/GenerationHistory';
import Community from '@/pages/Community';
import Achievements from '@/pages/Achievements';
import ParentalControls from '@/pages/ParentalControls';
import AIEcosystem from '@/pages/AIEcosystem';
import Quests from '@/pages/Quests';
import WorldBuilding from '@/pages/WorldBuilding';
import HapticSettings from '@/pages/HapticSettings';
import Install from '@/pages/Install';
import NotFound from '@/pages/NotFound';
import DocumentationPDF from '@/pages/DocumentationPDF';

// Direction context for page transitions
const NavigationDirectionContext = createContext<'forward' | 'back'>('forward');

const useNavigationDirection = () => useContext(NavigationDirectionContext);

// Forward navigation: slide from right
const forwardVariants = {
  initial: { opacity: 0, x: 30 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -30 },
};

// Back navigation: slide from left  
const backVariants = {
  initial: { opacity: 0, x: -30 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 30 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.25,
};

const reducedMotionVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const reducedMotionTransition = {
  duration: 0.15,
};

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const { settings } = useMotionSettings();
  const direction = useNavigationDirection();
  
  const variants = settings.reducedMotion 
    ? reducedMotionVariants 
    : direction === 'back' ? backVariants : forwardVariants;
  
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={settings.reducedMotion ? reducedMotionTransition : pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyStack = useRef<string[]>([]);
  const directionRef = useRef<'forward' | 'back'>('forward');
  const { bind, swipeProgress, isSwiping } = useSwipeBack();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Determine direction based on navigation type and history
    if (navigationType === 'POP') {
      // Browser back/forward button or programmatic navigate(-1)
      const lastIndex = historyStack.current.lastIndexOf(currentPath);
      if (lastIndex !== -1 && lastIndex < historyStack.current.length - 1) {
        // Going back to a previous page
        directionRef.current = 'back';
        historyStack.current = historyStack.current.slice(0, lastIndex + 1);
      } else {
        // Forward via browser button
        directionRef.current = 'forward';
        historyStack.current.push(currentPath);
      }
    } else if (navigationType === 'PUSH') {
      // Normal navigation forward
      directionRef.current = 'forward';
      historyStack.current.push(currentPath);
    } else if (navigationType === 'REPLACE') {
      // Replace current entry
      directionRef.current = 'forward';
      if (historyStack.current.length > 0) {
        historyStack.current[historyStack.current.length - 1] = currentPath;
      } else {
        historyStack.current.push(currentPath);
      }
    }
  }, [location.pathname, navigationType]);

  return (
    <NavigationDirectionContext.Provider value={directionRef.current}>
      <div {...bind()} className="w-full h-full touch-pan-y">
        <SwipeBackIndicator progress={swipeProgress} isActive={isSwiping} />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
            <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
            {/* Backwards-compatible aliases (command palette / deep links) */}
            <Route path="/signup" element={<Navigate to="/auth" state={{ mode: 'signup' }} replace />} />
            <Route path="/signin" element={<Navigate to="/auth" state={{ mode: 'signin' }} replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
            <Route path="/creative-journey" element={<ProtectedRoute><PageWrapper><CreativeJourney /></PageWrapper></ProtectedRoute>} />
            <Route path="/personas" element={<ProtectedRoute><PageWrapper><Personas /></PageWrapper></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><PageWrapper><Billing /></PageWrapper></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><PageWrapper><Feedback /></PageWrapper></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><PageWrapper><GenerationHistory /></PageWrapper></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><PageWrapper><Community /></PageWrapper></ProtectedRoute>} />
            <Route path="/achievements" element={<ProtectedRoute><PageWrapper><Achievements /></PageWrapper></ProtectedRoute>} />
            <Route path="/parental-controls" element={<ProtectedRoute><PageWrapper><ParentalControls /></PageWrapper></ProtectedRoute>} />
            <Route path="/ai-ecosystem" element={<ProtectedRoute><PageWrapper><AIEcosystem /></PageWrapper></ProtectedRoute>} />
            <Route path="/quests" element={<ProtectedRoute><PageWrapper><Quests /></PageWrapper></ProtectedRoute>} />
            <Route path="/world-building" element={<ProtectedRoute><PageWrapper><WorldBuilding /></PageWrapper></ProtectedRoute>} />
            <Route path="/haptic-settings" element={<ProtectedRoute><PageWrapper><HapticSettings /></PageWrapper></ProtectedRoute>} />
            <Route path="/install" element={<PageWrapper><Install /></PageWrapper>} />
            <Route path="/docs/pdf" element={<DocumentationPDF />} />
            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>
    </NavigationDirectionContext.Provider>
  );
};
