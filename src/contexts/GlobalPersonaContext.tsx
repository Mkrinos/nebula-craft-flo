import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserPersona } from '@/hooks/useUserPersona';
import type { Persona } from '@/hooks/usePersonas';

// Animation behavioral states for the persona
export type PersonaBehaviorState = 'idle' | 'greet' | 'navigate' | 'react' | 'speaking' | 'listening' | 'thinking';

// Animation profiles for different persona styles
export interface AnimationProfile {
  idleAnimation: object;
  greetAnimation: object;
  navigateAnimation: object;
  reactAnimation: object;
  speakingAnimation: object;
  transitionDuration: number;
}

const defaultAnimationProfile: AnimationProfile = {
  idleAnimation: {
    scale: [1, 1.02, 1],
    y: [0, -2, 0],
  },
  greetAnimation: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, -5, 0],
    y: [0, -10, 0],
  },
  navigateAnimation: {
    x: [0, -5, 5, 0],
    opacity: [1, 0.8, 1],
  },
  reactAnimation: {
    scale: [1, 1.15, 0.95, 1],
  },
  speakingAnimation: {
    scale: [1, 1.03, 1, 1.02, 1],
  },
  transitionDuration: 0.5,
};

// Style-specific animation profiles
const styleAnimationProfiles: Record<string, Partial<AnimationProfile>> = {
  'Cyberpunk': {
    idleAnimation: {
      scale: [1, 1.02, 1],
      filter: ['hue-rotate(0deg)', 'hue-rotate(10deg)', 'hue-rotate(0deg)'],
    },
    greetAnimation: {
      scale: [1, 1.15, 1],
      filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
    },
  },
  'Anime': {
    idleAnimation: {
      scale: [1, 1.03, 1],
      y: [0, -5, 0],
    },
    greetAnimation: {
      scale: [1, 1.2, 0.9, 1.1, 1],
      y: [0, -15, 0],
      rotate: [0, 10, -10, 0],
    },
  },
  'Minimalist': {
    idleAnimation: {
      opacity: [0.95, 1, 0.95],
    },
    greetAnimation: {
      scale: [1, 1.05, 1],
    },
    transitionDuration: 0.3,
  },
};

interface GlobalPersonaContextType {
  // Selected persona data
  persona: Persona | null;
  isLoading: boolean;
  
  // Behavioral state
  behaviorState: PersonaBehaviorState;
  setBehaviorState: (state: PersonaBehaviorState) => void;
  
  // Animation profile
  animationProfile: AnimationProfile;
  
  // Actions
  triggerGreet: () => void;
  triggerNavigate: () => void;
  triggerReact: () => void;
  triggerSpeak: () => void;
  triggerListen: () => void;
  triggerThink: () => void;
  resetToIdle: () => void;
  
  // Visibility in different UI locations
  showInHeader: boolean;
  showInSidebar: boolean;
  setShowInHeader: (value: boolean) => void;
  setShowInSidebar: (value: boolean) => void;
  
  // Refresh persona data
  refetch: () => void;
}

const GlobalPersonaContext = createContext<GlobalPersonaContextType | undefined>(undefined);

export function GlobalPersonaProvider({ children }: { children: ReactNode }) {
  const { selectedPersona, loading, refetch } = useUserPersona();
  const [behaviorState, setBehaviorState] = useState<PersonaBehaviorState>('idle');
  const [showInHeader, setShowInHeader] = useState(true);
  const [showInSidebar, setShowInSidebar] = useState(true);

  // Get animation profile based on persona style
  const animationProfile: AnimationProfile = {
    ...defaultAnimationProfile,
    ...(selectedPersona?.style ? styleAnimationProfiles[selectedPersona.style] : {}),
  };

  // Auto-reset to idle after animations
  useEffect(() => {
    if (behaviorState !== 'idle') {
      const timeout = setTimeout(() => {
        setBehaviorState('idle');
      }, animationProfile.transitionDuration * 1000 + 1500);
      
      return () => clearTimeout(timeout);
    }
  }, [behaviorState, animationProfile.transitionDuration]);

  // Trigger greet on initial load or persona change
  useEffect(() => {
    if (selectedPersona && !loading) {
      triggerGreet();
    }
  }, [selectedPersona?.id]);

  const triggerGreet = useCallback(() => {
    setBehaviorState('greet');
  }, []);

  const triggerNavigate = useCallback(() => {
    setBehaviorState('navigate');
  }, []);

  const triggerReact = useCallback(() => {
    setBehaviorState('react');
  }, []);

  const triggerSpeak = useCallback(() => {
    setBehaviorState('speaking');
  }, []);

  const triggerListen = useCallback(() => {
    setBehaviorState('listening');
  }, []);

  const triggerThink = useCallback(() => {
    setBehaviorState('thinking');
  }, []);

  const resetToIdle = useCallback(() => {
    setBehaviorState('idle');
  }, []);

  return (
    <GlobalPersonaContext.Provider value={{
      persona: selectedPersona,
      isLoading: loading,
      behaviorState,
      setBehaviorState,
      animationProfile,
      triggerGreet,
      triggerNavigate,
      triggerReact,
      triggerSpeak,
      triggerListen,
      triggerThink,
      resetToIdle,
      showInHeader,
      showInSidebar,
      setShowInHeader,
      setShowInSidebar,
      refetch,
    }}>
      {children}
    </GlobalPersonaContext.Provider>
  );
}

export function useGlobalPersona() {
  const context = useContext(GlobalPersonaContext);
  if (!context) {
    throw new Error('useGlobalPersona must be used within GlobalPersonaProvider');
  }
  return context;
}
