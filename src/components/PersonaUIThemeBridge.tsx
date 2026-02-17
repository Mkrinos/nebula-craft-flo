import { useEffect } from 'react';
import { usePersonaTheme } from '@/contexts/PersonaThemeContext';
import { useUITheme } from '@/contexts/UIThemeContext';

/**
 * Bridge component that syncs PersonaTheme with UITheme.
 * When persona changes, it suggests the appropriate UI theme.
 */
export function PersonaUIThemeBridge() {
  const { personaStyle } = usePersonaTheme();
  const { setThemeFromPersona } = useUITheme();

  useEffect(() => {
    if (personaStyle) {
      setThemeFromPersona(personaStyle);
    }
  }, [personaStyle, setThemeFromPersona]);

  return null;
}
