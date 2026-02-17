import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface FocusManagerProps {
  children: React.ReactNode;
}

export const FocusManager = ({ children }: FocusManagerProps) => {
  const location = useLocation();
  const previousPath = useRef<string>(location.pathname);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Announce route changes to screen readers
  const announceRouteChange = useCallback((path: string) => {
    const pageTitles: Record<string, string> = {
      '/': 'Welcome',
      '/dashboard': 'Dashboard',
      '/creative-journey': 'Creative Journey',
      '/quests': 'Quests',
      '/world-building': 'World Building Studio',
      '/history': 'Generation History',
      '/community': 'Community',
      '/ai-ecosystem': 'AI Ecosystem Explorer',
      '/achievements': 'Achievements',
      '/personas': 'Personas',
      '/billing': 'Billing',
      '/feedback': 'Feedback',
      '/parental-controls': 'Parental Controls',
      '/haptic-settings': 'Haptic Settings',
    };

    const pageTitle = pageTitles[path] || 'Page';
    
    // Create or update the live region announcement
    let announcer = document.getElementById('route-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    
    // Clear and set new announcement with slight delay for proper announcement
    announcer.textContent = '';
    setTimeout(() => {
      announcer!.textContent = `Navigated to ${pageTitle}`;
    }, 100);
  }, []);

  // Focus main content on route change
  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      previousPath.current = location.pathname;
      
      // Announce the route change
      announceRouteChange(location.pathname);

      // Focus main content after a short delay for render
      requestAnimationFrame(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus({ preventScroll: true });
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [location.pathname, announceRouteChange]);

  // Handle keyboard trap for modals (managed by Radix, but we ensure escape works globally)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global escape key handler for emergency focus reset
      if (e.key === 'Escape' && e.shiftKey) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <>{children}</>;
};

export default FocusManager;
