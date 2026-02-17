import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import { PullToRefresh } from '@/components/PullToRefresh';
import StarfieldBackground from '@/components/StarfieldBackground';
import PersonaCard from '@/components/PersonaCard';
import { SEOHead } from '@/components/SEOHead';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiInput } from '@/components/ui/sci-fi-input';
import { SciFiProgress } from '@/components/ui/sci-fi-progress';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { SciFiDivider } from '@/components/ui/sci-fi-divider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePersonas } from '@/hooks/usePersonas';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search,
  Coins,
  Sparkles,
  Info,
  Lock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';

const Personas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    personas,
    loading,
    userCredits,
    isUnlocked,
    canUnlock,
    unlockPersona,
    generateAvatar,
    generatingAvatarFor,
    selectedPersonaId,
    setProfilePersona
  } = usePersonas();

  const filteredPersonas = personas.filter(persona =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starterPersonas = filteredPersonas.filter(p => p.is_starter);
  const lockablePersonas = filteredPersonas.filter(p => !p.is_starter);
  const unlockedCount = personas.filter(p => isUnlocked(p)).length;

  const handleUsePersona = (persona: typeof personas[0]) => {
    if (!user) {
      toast.error('Please sign in to use personas');
      navigate('/auth');
      return;
    }
    toast.success(`Now using ${persona.name} style!`);
    navigate('/');
  };

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success('Personas refreshed');
  }, []);

  return (
    <SwipeablePageWrapper>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen relative">
        <SEOHead 
          title="AI Personas - Unique Artistic Styles"
          description="Unlock and customize AI personas for unique artistic styles. Each persona offers a distinct creative approach to image generation."
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'Personas', url: '/personas' },
          ]}
        />
        <StarfieldBackground />
        <Navigation />
      <main className="relative z-10 pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 pb-safe">
        <div className="container mx-auto max-w-7xl">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4">
            <BackButton />
            <Breadcrumb>
              <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Personas</BreadcrumbPage>
              </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                <span className="text-gradient">AI Personas</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                Unlock unique artistic styles through your creative journey
              </p>
            </div>
            
            {/* Credits display */}
            {user && (
              <SciFiFrame glowIntensity="subtle" className="px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 self-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border border-neon-cyan/50 bg-neon-cyan/10 flex items-center justify-center">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-display uppercase tracking-widest text-muted-foreground">Your Credits</p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-neon-cyan">{userCredits.available}</p>
                </div>
              </SciFiFrame>
            )}
          </div>

          {/* Coming soon notice */}
          <SciFiPanel 
            title="SYSTEM UPDATE" 
            status="active" 
            className="mb-4 sm:mb-6"
            headerRight={<SciFiBadge variant="accent" size="sm" className="text-xs">NEW</SciFiBadge>}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan mt-0.5 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-foreground font-medium">Personas are evolving!</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  More animated avatars, persona customization, and downloadable assets coming soon. 
                  Earn credits by generating images to unlock new personas!
                </p>
              </div>
            </div>
          </SciFiPanel>

          {/* Progress bar */}
          <SciFiFrame glowIntensity="subtle" className="p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan" />
              <span className="font-display text-xs sm:text-sm uppercase tracking-widest text-foreground">Persona Collection</span>
            </div>
            <SciFiProgress 
              value={unlockedCount} 
              max={personas.length} 
              variant="segmented"
              size="lg"
              showValue
            />
          </SciFiFrame>

          {/* Search */}
          <SciFiFrame glowIntensity="none" className="p-3 sm:p-4 mb-6 sm:mb-8">
            <SciFiInput
              type="text"
              placeholder="Search personas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="text-base"
            />
          </SciFiFrame>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <SciFiFrame key={i} className="p-3 sm:p-6">
                  <Skeleton className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl mb-3 sm:mb-4" />
                  <Skeleton className="h-4 sm:h-6 w-3/4 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-full mb-3 sm:mb-4" />
                  <Skeleton className="h-6 sm:h-8 w-full" />
                </SciFiFrame>
              ))}
            </div>
          ) : (
            <>
              {/* Starter Personas Section */}
              <div className="mb-8 sm:mb-10">
                <h2 className="font-display text-base sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-1.5 sm:w-2 h-5 sm:h-6 bg-neon-cyan" />
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan" />
                  <span>Starter Personas</span>
                  <SciFiBadge variant="success" size="sm" className="text-xs">FREE</SciFiBadge>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {starterPersonas.map((persona) => (
                    <PersonaCard
                      key={persona.id}
                      persona={persona}
                      isUnlocked={isUnlocked(persona)}
                      canUnlock={canUnlock(persona)}
                      isSelected={selectedPersonaId === persona.id}
                      onUnlock={() => unlockPersona(persona)}
                      onUse={() => handleUsePersona(persona)}
                      onSetAsProfile={() => setProfilePersona(persona.id)}
                      onGenerateAvatar={() => generateAvatar(persona)}
                      isGeneratingAvatar={generatingAvatarFor === persona.id}
                    />
                  ))}
                </div>
              </div>

              <SciFiDivider variant="decorated" className="mb-8 sm:mb-10" />

              {/* Unlockable Personas Section */}
              <div>
                <h2 className="font-display text-base sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-1.5 sm:w-2 h-5 sm:h-6 bg-primary" />
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <span>Unlockable Personas</span>
                  <span className="text-[10px] sm:text-sm font-normal text-muted-foreground flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Earn credits
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {lockablePersonas.map((persona) => (
                    <PersonaCard
                      key={persona.id}
                      persona={persona}
                      isUnlocked={isUnlocked(persona)}
                      canUnlock={canUnlock(persona)}
                      isSelected={selectedPersonaId === persona.id}
                      onUnlock={() => unlockPersona(persona)}
                      onUse={() => handleUsePersona(persona)}
                      onSetAsProfile={() => setProfilePersona(persona.id)}
                      onGenerateAvatar={() => generateAvatar(persona)}
                      isGeneratingAvatar={generatingAvatarFor === persona.id}
                    />
                  ))}
                </div>
              </div>

              {filteredPersonas.length === 0 && (
                <SciFiFrame glowIntensity="subtle" className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-2 border-neon-cyan/40 bg-neon-cyan/10 flex items-center justify-center">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-neon-cyan" />
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-semibold text-foreground mb-2">No personas found</h3>
                  <p className="text-sm text-muted-foreground">Try a different search term</p>
                </SciFiFrame>
              )}
            </>
          )}
        </div>
      </main>
      
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
      </PullToRefresh>
    </SwipeablePageWrapper>
  );
};

export default Personas;
