import { useCallback } from 'react';

interface SkipLink {
  id: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
];

interface SkipNavigationProps {
  links?: SkipLink[];
}

export const SkipNavigation = ({ links = defaultSkipLinks }: SkipNavigationProps) => {
  const handleSkip = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav 
      className="skip-navigation" 
      aria-label="Skip navigation"
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => {
            e.preventDefault();
            handleSkip(link.id);
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipNavigation;
