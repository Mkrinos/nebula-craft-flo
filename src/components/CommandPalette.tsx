import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Home, 
  Image, 
  Users, 
  CreditCard, 
  MessageSquare, 
  LayoutDashboard,
  Sparkles,
  User,
  Keyboard,
  Trophy
} from 'lucide-react';
import { useGlobalPersona } from '@/contexts/GlobalPersonaContext';
import { usePersonas } from '@/hooks/usePersonas';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { persona: currentPersona } = useGlobalPersona();
  const { personas, setProfilePersona, isUnlocked } = usePersonas();
  const haptic = useHapticFeedback();

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        haptic.trigger('light');
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [haptic]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    haptic.trigger('selection');
    command();
  }, [haptic]);

  const handleNavigate = useCallback((path: string) => {
    runCommand(() => navigate(path));
  }, [navigate, runCommand]);

  const handleSelectPersona = useCallback(async (personaId: string, personaName: string) => {
    runCommand(async () => {
      await setProfilePersona(personaId);
      toast.success(`Switched to ${personaName}`);
    });
  }, [runCommand, setProfilePersona]);

  const handleGenerateImage = useCallback(() => {
    runCommand(() => {
      navigate('/creative-journey');
      toast.info('Ready to create! Enter your prompt to generate an image.');
    });
  }, [navigate, runCommand]);

  // Filter to only show unlocked personas for quick switching
  const unlockedPersonas = personas.filter(p => p.is_starter || isUnlocked(p));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handleGenerateImage}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Generate New Image</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/dashboard')}>
            <Trophy className="mr-2 h-4 w-4" />
            <span>View Achievements</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/creative-journey')}>
            <Image className="mr-2 h-4 w-4" />
            <span>Creative Journey</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/personas')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Personas</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/billing')}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing & Credits</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/feedback')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Feedback</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Persona Switching */}
        {unlockedPersonas.length > 0 && (
          <CommandGroup heading="Switch Persona">
            {unlockedPersonas.map((persona) => (
              <CommandItem
                key={persona.id}
                onSelect={() => handleSelectPersona(persona.id, persona.name)}
                className={currentPersona?.id === persona.id ? 'bg-accent/50' : ''}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{persona.name}</span>
                {currentPersona?.id === persona.id && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Help */}
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => runCommand(() => toast.info('Press ⌘K or Ctrl+K to open this palette anytime!'))}>
            <Keyboard className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
