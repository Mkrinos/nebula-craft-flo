import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Home, Palette, Edit3, Eye, 
  ChevronRight, Lock, Trophy, Scroll, Star, ShoppingBag, Users, Calendar, Globe, Gift, MessageCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useStudioSpaces } from '@/hooks/useStudioSpaces';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { StudioCard } from '@/components/worldbuilding/StudioCard';
import { DecorationCard } from '@/components/worldbuilding/DecorationCard';
import { StudioViewer } from '@/components/worldbuilding/StudioViewer';
import { DecorationShop } from '@/components/worldbuilding/DecorationShop';
import { StudioVisitorsPanel } from '@/components/worldbuilding/StudioVisitorsPanel';
import { SeasonalEvents } from '@/components/worldbuilding/SeasonalEvents';
import { StudioAchievements } from '@/components/worldbuilding/StudioAchievements';
import { PublicStudioGallery } from '@/components/worldbuilding/PublicStudioGallery';
import { StudioLeaderboard } from '@/components/worldbuilding/StudioLeaderboard';
import { EventExclusiveRewards } from '@/components/worldbuilding/EventExclusiveRewards';
import { StudioSocialPanel } from '@/components/worldbuilding/StudioSocialPanel';
import { WorldBuildingTour } from '@/components/worldbuilding/WorldBuildingTour';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';

export default function WorldBuilding() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const {
    studios,
    decorations,
    activeStudio,
    placements,
    isLoading,
    isStudioUnlocked,
    isDecorationUnlocked,
    unlockStudio,
    setActiveStudioById,
    placeDecoration,
    removeDecoration,
    purchaseDecoration,
    getStudioPlacements,
  } = useStudioSpaces();

  const creditsRemaining = subscription?.credits_remaining ?? 0;

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDecoration, setSelectedDecoration] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('studios');
  const [tourHighlight, setTourHighlight] = useState<string | null>(null);

  const handleTourHighlight = useCallback((highlight: string | null) => {
    setTourHighlight(highlight);
  }, []);

  // Get placements with decoration data for the active studio
  const activePlacements = useMemo(() => {
    if (!activeStudio) return [];
    
    return getStudioPlacements(activeStudio.id).map(p => ({
      ...p,
      decoration: decorations.find(d => d.id === p.decoration_id)!,
    })).filter(p => p.decoration);
  }, [activeStudio, placements, decorations, getStudioPlacements]);

  // Group decorations by category
  const decorationsByCategory = useMemo(() => {
    const categories = ['furniture', 'art', 'lighting', 'plants', 'tech'];
    return categories.reduce((acc, cat) => {
      acc[cat] = decorations.filter(d => d.category === cat);
      return acc;
    }, {} as Record<string, typeof decorations>);
  }, [decorations]);

  const unlockedStudiosCount = studios.filter(s => isStudioUnlocked(s.id)).length;
  const unlockedDecorationsCount = decorations.filter(d => isDecorationUnlocked(d.id)).length;

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('World refreshed');
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access World Building</h1>
          <p className="text-muted-foreground">Create and customize your creative studio spaces!</p>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 pt-20 pb-24">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton />
          </div>
          
          {/* Header */}
          <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Home className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              World Building
            </h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Unlock and customize your creative studio spaces with decorations earned from achievements and quests
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <Badge variant="outline" className="gap-1">
              <Home className="w-3 h-3" />
              {unlockedStudiosCount}/{studios.length} Studios
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Palette className="w-3 h-3" />
              {unlockedDecorationsCount}/{decorations.length} Decorations
            </Badge>
          </div>
        </motion.div>

        {/* Active Studio Viewer */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Your Active Studio
            </h2>
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "gap-2",
                tourHighlight === 'edit-button' && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
              )}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-4 h-4" />
                  View Mode
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit Mode
                </>
              )}
            </Button>
          </div>
          
          <div className={cn(
            "transition-all",
            tourHighlight === 'studio-viewer' && "ring-2 ring-primary rounded-lg"
          )}>
            <StudioViewer
              studio={activeStudio}
              placements={activePlacements}
              decorations={decorations}
              selectedDecoration={selectedDecoration}
              isEditMode={isEditMode}
              onPlaceDecoration={(decorationId, position) => {
                if (activeStudio) {
                  placeDecoration(activeStudio.id, decorationId, position);
                  setSelectedDecoration(null);
                }
              }}
              onRemoveDecoration={removeDecoration}
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto min-w-full justify-start gap-1 p-1">
              <TabsTrigger 
                value="studios" 
                className={cn(
                  "gap-1 text-xs sm:text-sm",
                  tourHighlight === 'studios-tab' && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Studios</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1 text-xs sm:text-sm">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-1 text-xs sm:text-sm">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Ranks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="decorations" 
                className={cn(
                  "gap-1 text-xs sm:text-sm",
                  tourHighlight === 'decor-tab' && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Decor</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="gap-1 text-xs sm:text-sm">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Shop</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-1 text-xs sm:text-sm">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Rewards</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1 text-xs sm:text-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-1 text-xs sm:text-sm">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="studios" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {studios.map((studio) => (
                <StudioCard
                  key={studio.id}
                  studio={studio}
                  isUnlocked={isStudioUnlocked(studio.id)}
                  isActive={activeStudio?.id === studio.id}
                  onUnlock={() => unlockStudio(studio.id)}
                  onSelect={() => setActiveStudioById(studio.id)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="decorations" className="space-y-6">
            {isEditMode && (
              <motion.div
                className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm">
                  {selectedDecoration 
                    ? "Click on your studio above to place the decoration"
                    : "Select a decoration below, then click on your studio to place it"
                  }
                </p>
              </motion.div>
            )}
            
            {Object.entries(decorationsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3 capitalize flex items-center gap-2">
                  {category}
                  <Badge variant="secondary" className="text-xs">
                    {items.filter(d => isDecorationUnlocked(d.id)).length}/{items.length}
                  </Badge>
                </h3>
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-4">
                    {items.map((decoration) => (
                      <div key={decoration.id} className="w-24 flex-shrink-0">
                        <DecorationCard
                          decoration={decoration}
                          isUnlocked={isDecorationUnlocked(decoration.id)}
                          isSelected={selectedDecoration === decoration.id && isEditMode}
                          onSelect={() => {
                            if (isEditMode) {
                              setSelectedDecoration(
                                selectedDecoration === decoration.id ? null : decoration.id
                              );
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="shop">
            <DecorationShop
              decorations={decorations}
              creditsRemaining={creditsRemaining}
              isDecorationUnlocked={isDecorationUnlocked}
              onPurchase={purchaseDecoration}
            />
          </TabsContent>

          <TabsContent value="gallery">
            <PublicStudioGallery />
          </TabsContent>

          <TabsContent value="leaderboard">
            <StudioLeaderboard />
          </TabsContent>

          <TabsContent value="rewards">
            <EventExclusiveRewards />
          </TabsContent>

          <TabsContent value="events">
            <SeasonalEvents />
          </TabsContent>

          <TabsContent value="social">
            <StudioSocialPanel
              activeStudio={activeStudio}
              placementsCount={activePlacements.length}
              totalDecorations={decorations.length}
            />
          </TabsContent>
        </Tabs>
      </main>

      <MobileBottomNav />

      {/* Onboarding Tour */}
      {user && <WorldBuildingTour onHighlight={handleTourHighlight} />}
    </div>
    </PullToRefresh>
  );
}
