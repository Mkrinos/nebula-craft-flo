import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Available UI themes based on the design specification
export type UITheme = 
  | 'scifi' 
  | 'cyberpunk' 
  | 'abstract' 
  | 'minimal' 
  | 'darkmode' 
  | 'vaporwave' 
  | 'artdeco' 
  | 'nature' 
  | 'gaming';

export interface UIThemeConfig {
  id: UITheme;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    header: string;
    body: string;
  };
  borderRadius: string;
  effects: string;
  unlockRequirement?: {
    type: 'starter' | 'achievement' | 'credits' | 'tier';
    creditCost?: number;
    tierRequired?: string; // subscription tier that auto-unlocks
    achievementId?: string;
    description?: string;
  };
}

// Theme configurations following the PDF specification
export const uiThemeConfigs: Record<UITheme, UIThemeConfig> = {
  scifi: {
    id: 'scifi',
    name: 'Sci-Fi',
    description: 'HUD aesthetic with translucency and holographic blues',
    colors: {
      primary: '#00D2FF',
      secondary: '#FFFFFF',
      background: '#050A14',
      surface: '#003366',
      text: '#AACCFF',
    },
    typography: {
      header: 'Exo 2',
      body: 'Share Tech Mono',
    },
    borderRadius: '4px',
    effects: 'Glassmorphism, inner glow borders',
    unlockRequirement: { type: 'starter' },
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon saturated colors with glitch effects',
    colors: {
      primary: '#FCEE09',
      secondary: '#00F0FF',
      background: '#0B0B0B',
      surface: '#1A1A1A',
      text: '#FFFFFF',
    },
    typography: {
      header: 'Orbitron',
      body: 'Roboto Mono',
    },
    borderRadius: '0px',
    effects: 'Neon glow, text shadows',
    unlockRequirement: { type: 'starter' },
  },
  abstract: {
    id: 'abstract',
    name: 'Abstract',
    description: 'Playful Memphis-style with geometric shapes',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      background: '#F7F9FC',
      surface: '#FFFFFF',
      text: '#2D3436',
    },
    typography: {
      header: 'Poppins',
      body: 'Nunito',
    },
    borderRadius: '20px',
    effects: 'Hard drop shadows, offset borders',
    unlockRequirement: { type: 'starter' },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Swiss design with extreme focus on whitespace',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      surface: '#F8F8F8',
      text: '#111111',
    },
    typography: {
      header: 'Inter',
      body: 'Inter',
    },
    borderRadius: '4px',
    effects: 'None, flat design',
    unlockRequirement: { type: 'starter' },
  },
  darkmode: {
    id: 'darkmode',
    name: 'Dark Mode',
    description: 'OLED-optimized with battery efficiency and eye comfort',
    colors: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      background: '#000000',
      surface: '#1C1C1E',
      text: '#FFFFFF',
    },
    typography: {
      header: 'SF Pro',
      body: 'SF Pro',
    },
    borderRadius: '8px',
    effects: 'Subtle glows, minimal borders',
    unlockRequirement: { type: 'starter' },
  },
  vaporwave: {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Nostalgic 80s/90s aesthetic with neon pastels',
    colors: {
      primary: '#FF71CE',
      secondary: '#01CDFE',
      background: '#1A0B2E',
      surface: '#2D1B4E',
      text: '#01CDFE',
    },
    typography: {
      header: 'Press Start 2P',
      body: 'VT323',
    },
    borderRadius: '0px',
    effects: 'Glitch effects, VHS scan lines',
    unlockRequirement: {
      type: 'credits',
      creditCost: 50,
      tierRequired: 'cosmic_voyage',
      description: 'Unlock with 50 credits or Cosmic tier',
    },
  },
  artdeco: {
    id: 'artdeco',
    name: 'Art Deco',
    description: 'Luxury 1920s elegance with gold accents',
    colors: {
      primary: '#D4AF37',
      secondary: '#50C878',
      background: '#FAF9F6',
      surface: '#FFFFF0',
      text: '#2F2F2F',
    },
    typography: {
      header: 'Playfair Display',
      body: 'Montserrat',
    },
    borderRadius: '2px',
    effects: 'Metallic gradients, geometric patterns',
    unlockRequirement: {
      type: 'credits',
      creditCost: 100,
      tierRequired: 'galactic_odyssey',
      description: 'Unlock with 100 credits or Galactic tier',
    },
  },
  nature: {
    id: 'nature',
    name: 'Nature Organic',
    description: 'Calming biophilic design with earth tones',
    colors: {
      primary: '#2D5016',
      secondary: '#9CAF88',
      background: '#FAF8F3',
      surface: '#E8E3D6',
      text: '#3E2723',
    },
    typography: {
      header: 'Lora',
      body: 'Open Sans',
    },
    borderRadius: '16px',
    effects: 'Paper textures, watercolor washes',
    unlockRequirement: {
      type: 'credits',
      creditCost: 75,
      tierRequired: 'stellar_journey',
      description: 'Unlock with 75 credits or Stellar tier',
    },
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming RGB',
    description: 'Dynamic esports aesthetic with RGB effects',
    colors: {
      primary: '#FF0000',
      secondary: '#A020F0',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#FFFFFF',
    },
    typography: {
      header: 'Rajdhani',
      body: 'Exo 2',
    },
    borderRadius: '4px',
    effects: 'RGB cycling, chromatic aberration',
    unlockRequirement: {
      type: 'credits',
      creditCost: 150,
      tierRequired: 'galactic_odyssey',
      description: 'Unlock with 150 credits or Galactic tier',
    },
  },
};

// Theme costs for credit purchases
export const themeCreditCosts: Partial<Record<UITheme, number>> = {
  vaporwave: 50,
  nature: 75,
  artdeco: 100,
  gaming: 150,
};

// Themes unlocked by subscription tier
export const tierThemeUnlocks: Record<string, UITheme[]> = {
  starter_universe: [],
  stellar_journey: ['nature'],
  cosmic_voyage: ['nature', 'vaporwave'],
  galactic_odyssey: ['nature', 'vaporwave', 'artdeco', 'gaming'],
};

// Map persona styles to recommended UI themes (for hybrid approach)
export const personaToThemeMap: Record<string, UITheme> = {
  'Cyberpunk': 'cyberpunk',
  'Surreal': 'abstract',
  'Pixel Art': 'vaporwave',
  'Fantasy': 'scifi',
  'Minimalist': 'minimal',
  'Abstract': 'abstract',
  'Vintage': 'artdeco',
  'Anime': 'gaming',
  'Steampunk': 'scifi',
  'Gothic': 'darkmode',
  'Vaporwave': 'vaporwave',
  'Nature': 'nature',
  'Organic': 'nature',
  'Retro': 'vaporwave',
  'Luxury': 'artdeco',
  'Gaming': 'gaming',
  'Dark': 'darkmode',
};

// Starter themes that are always unlocked
export const starterThemes: UITheme[] = ['scifi', 'cyberpunk', 'abstract', 'minimal', 'darkmode'];

// Check if a theme is a starter theme
export function isStarterTheme(themeId: UITheme): boolean {
  return starterThemes.includes(themeId);
}

interface UIThemeContextType {
  currentTheme: UITheme;
  themeConfig: UIThemeConfig;
  isCustomOverride: boolean;
  setTheme: (theme: UITheme) => void;
  setThemeFromPersona: (personaStyle: string) => void;
  resetToPersonaDefault: () => void;
  availableThemes: UIThemeConfig[];
}

const STORAGE_KEY = 'nexus-ui-theme';
const OVERRIDE_KEY = 'nexus-ui-theme-override';

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined);

export function UIThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<UITheme>('scifi');
  const [isCustomOverride, setIsCustomOverride] = useState(false);
  const [personaDefaultTheme, setPersonaDefaultTheme] = useState<UITheme>('scifi');

  // Apply theme to document
  const applyTheme = useCallback((theme: UITheme) => {
    const root = document.documentElement;
    root.setAttribute('data-ui-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, []);

  // Set theme with custom override flag
  const setTheme = useCallback((theme: UITheme) => {
    setCurrentTheme(theme);
    setIsCustomOverride(true);
    localStorage.setItem(OVERRIDE_KEY, 'true');
    applyTheme(theme);
  }, [applyTheme]);

  // Set theme based on persona (doesn't set override flag)
  const setThemeFromPersona = useCallback((personaStyle: string) => {
    const mappedTheme = personaToThemeMap[personaStyle] || 'scifi';
    setPersonaDefaultTheme(mappedTheme);
    
    // Only apply if user hasn't overridden
    const hasOverride = localStorage.getItem(OVERRIDE_KEY) === 'true';
    if (!hasOverride) {
      setCurrentTheme(mappedTheme);
      applyTheme(mappedTheme);
    }
  }, [applyTheme]);

  // Reset to persona default
  const resetToPersonaDefault = useCallback(() => {
    setIsCustomOverride(false);
    localStorage.removeItem(OVERRIDE_KEY);
    setCurrentTheme(personaDefaultTheme);
    applyTheme(personaDefaultTheme);
  }, [personaDefaultTheme, applyTheme]);

  // Initialize from storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as UITheme | null;
    const hasOverride = localStorage.getItem(OVERRIDE_KEY) === 'true';
    
    if (savedTheme && uiThemeConfigs[savedTheme]) {
      setCurrentTheme(savedTheme);
      setIsCustomOverride(hasOverride);
      applyTheme(savedTheme);
    } else {
      applyTheme('scifi');
    }
  }, [applyTheme]);

  const themeConfig = uiThemeConfigs[currentTheme];
  const availableThemes = Object.values(uiThemeConfigs);

  return (
    <UIThemeContext.Provider value={{
      currentTheme,
      themeConfig,
      isCustomOverride,
      setTheme,
      setThemeFromPersona,
      resetToPersonaDefault,
      availableThemes,
    }}>
      {children}
    </UIThemeContext.Provider>
  );
}

export function useUITheme() {
  const context = useContext(UIThemeContext);
  if (!context) {
    throw new Error('useUITheme must be used within UIThemeProvider');
  }
  return context;
}
