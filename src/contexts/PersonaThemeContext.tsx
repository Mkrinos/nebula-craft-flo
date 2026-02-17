import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserPersona } from '@/hooks/useUserPersona';

// Persona style tokens - subtle variations that don't break layout
export interface PersonaThemeTokens {
  accentGlow: string;
  accentColor: string;
  glowIntensity: 'none' | 'subtle' | 'medium' | 'high';
  particleColor: string;
  ambientEffect: 'none' | 'particles' | 'shimmer' | 'pulse';
  microPattern: string;
  iconStyle: 'default' | 'rounded' | 'angular' | 'organic';
}

// Default theme for onboarding/no persona selected
const defaultTheme: PersonaThemeTokens = {
  accentGlow: 'hsl(var(--neon-cyan))',
  accentColor: 'neon-cyan',
  glowIntensity: 'subtle',
  particleColor: 'bg-neon-cyan',
  ambientEffect: 'shimmer',
  microPattern: 'none',
  iconStyle: 'default',
};

// Persona-specific theme variations (subtle, not layout-breaking)
const personaThemes: Record<string, PersonaThemeTokens> = {
  'Cyberpunk': {
    accentGlow: 'hsl(186 100% 50%)',
    accentColor: 'neon-cyan',
    glowIntensity: 'high',
    particleColor: 'bg-cyan-400',
    ambientEffect: 'particles',
    microPattern: 'grid',
    iconStyle: 'angular',
  },
  'Surreal': {
    accentGlow: 'hsl(263 100% 65%)',
    accentColor: 'primary',
    glowIntensity: 'medium',
    particleColor: 'bg-purple-400',
    ambientEffect: 'shimmer',
    microPattern: 'waves',
    iconStyle: 'organic',
  },
  'Pixel Art': {
    accentGlow: 'hsl(142 76% 46%)',
    accentColor: 'accent',
    glowIntensity: 'subtle',
    particleColor: 'bg-green-400',
    ambientEffect: 'pulse',
    microPattern: 'dots',
    iconStyle: 'angular',
  },
  'Fantasy': {
    accentGlow: 'hsl(160 84% 39%)',
    accentColor: 'accent',
    glowIntensity: 'medium',
    particleColor: 'bg-emerald-400',
    ambientEffect: 'particles',
    microPattern: 'organic',
    iconStyle: 'organic',
  },
  'Minimalist': {
    accentGlow: 'hsl(0 0% 70%)',
    accentColor: 'muted-foreground',
    glowIntensity: 'none',
    particleColor: 'bg-slate-400',
    ambientEffect: 'none',
    microPattern: 'none',
    iconStyle: 'rounded',
  },
  'Abstract': {
    accentGlow: 'hsl(25 95% 53%)',
    accentColor: 'destructive',
    glowIntensity: 'medium',
    particleColor: 'bg-orange-400',
    ambientEffect: 'shimmer',
    microPattern: 'abstract',
    iconStyle: 'organic',
  },
  'Vintage': {
    accentGlow: 'hsl(45 93% 47%)',
    accentColor: 'accent',
    glowIntensity: 'subtle',
    particleColor: 'bg-amber-400',
    ambientEffect: 'none',
    microPattern: 'lines',
    iconStyle: 'rounded',
  },
  'Anime': {
    accentGlow: 'hsl(320 100% 60%)',
    accentColor: 'primary',
    glowIntensity: 'high',
    particleColor: 'bg-pink-400',
    ambientEffect: 'particles',
    microPattern: 'stars',
    iconStyle: 'rounded',
  },
  'Steampunk': {
    accentGlow: 'hsl(32 95% 44%)',
    accentColor: 'accent',
    glowIntensity: 'subtle',
    particleColor: 'bg-amber-500',
    ambientEffect: 'pulse',
    microPattern: 'gears',
    iconStyle: 'angular',
  },
  'Gothic': {
    accentGlow: 'hsl(270 50% 40%)',
    accentColor: 'primary',
    glowIntensity: 'subtle',
    particleColor: 'bg-purple-600',
    ambientEffect: 'shimmer',
    microPattern: 'ornate',
    iconStyle: 'angular',
  },
  'Vaporwave': {
    accentGlow: 'hsl(300 76% 72%)',
    accentColor: 'primary',
    glowIntensity: 'high',
    particleColor: 'bg-pink-400',
    ambientEffect: 'shimmer',
    microPattern: 'retro',
    iconStyle: 'rounded',
  },
};

interface PersonaThemeContextType {
  theme: PersonaThemeTokens;
  personaStyle: string | null;
  isLoading: boolean;
  applyPersonaTheme: (style: string) => void;
  resetToDefault: () => void;
}

const PersonaThemeContext = createContext<PersonaThemeContextType | undefined>(undefined);

export function PersonaThemeProvider({ children }: { children: ReactNode }) {
  const { selectedPersona, loading } = useUserPersona();
  const [theme, setTheme] = useState<PersonaThemeTokens>(defaultTheme);
  const [personaStyle, setPersonaStyle] = useState<string | null>(null);

  const applyPersonaTheme = useCallback((style: string) => {
    const newTheme = personaThemes[style] || defaultTheme;
    setTheme(newTheme);
    setPersonaStyle(style);
    
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement;
    root.style.setProperty('--persona-accent-glow', newTheme.accentGlow);
    root.style.setProperty('--persona-glow-intensity', 
      newTheme.glowIntensity === 'none' ? '0' : 
      newTheme.glowIntensity === 'subtle' ? '0.3' :
      newTheme.glowIntensity === 'medium' ? '0.5' : '0.7'
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setTheme(defaultTheme);
    setPersonaStyle(null);
    const root = document.documentElement;
    root.style.setProperty('--persona-accent-glow', defaultTheme.accentGlow);
    root.style.setProperty('--persona-glow-intensity', '0.3');
  }, []);

  // Auto-apply theme when persona changes
  useEffect(() => {
    if (selectedPersona?.style) {
      applyPersonaTheme(selectedPersona.style);
    } else {
      resetToDefault();
    }
  }, [selectedPersona, applyPersonaTheme, resetToDefault]);

  return (
    <PersonaThemeContext.Provider value={{
      theme,
      personaStyle,
      isLoading: loading,
      applyPersonaTheme,
      resetToDefault,
    }}>
      {children}
    </PersonaThemeContext.Provider>
  );
}

export function usePersonaTheme() {
  const context = useContext(PersonaThemeContext);
  if (!context) {
    throw new Error('usePersonaTheme must be used within PersonaThemeProvider');
  }
  return context;
}

export { personaThemes, defaultTheme };
