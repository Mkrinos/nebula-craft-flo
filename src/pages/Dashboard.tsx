import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { createDndKitHaptics } from '@/hooks/useReorderHaptics';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import { PullToRefresh } from '@/components/PullToRefresh';
import StarfieldBackground from '@/components/StarfieldBackground';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { SEOHead } from '@/components/SEOHead';
import { SidebarLayout, SidebarHeader } from '@/components/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { SocialFeedWidget } from '@/components/dashboard/SocialFeedWidget';
import { TipsWidget } from '@/components/dashboard/TipsWidget';
import { QuestsWidget } from '@/components/dashboard/QuestsWidget';
import { CreatorsWidget } from '@/components/dashboard/CreatorsWidget';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { DashboardTour } from '@/components/dashboard/DashboardTour';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import { 
  Settings2, 
  RotateCcw,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { settings } = useMotionSettings();
  const isMobile = useIsMobile();
  const {
    visibleWidgets,
    hiddenWidgets,
    isEditing,
    setIsEditing,
    loading,
    moveWidget,
    resizeWidget,
    toggleWidget,
    resetLayout
  } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Haptic feedback for drag-and-drop
  const dndHaptics = createDndKitHaptics();

  const handleDragStart = (event: DragStartEvent) => {
    dndHaptics.onDragStart();
  };

  const handleDragOver = (event: DragOverEvent) => {
    dndHaptics.onDragOver({ over: event.over ? { id: String(event.over.id) } : null });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Trigger haptic feedback
    dndHaptics.onDragEnd({ 
      active: { id: String(active.id) }, 
      over: over ? { id: String(over.id) } : null 
    });
    
    if (over && active.id !== over.id) {
      moveWidget(active.id as string, over.id as string);
    }
  };

  const renderWidget = (widget: typeof visibleWidgets[0]) => {
    switch (widget.type) {
      case 'stats':
        return <StatsWidget />;
      case 'quick-actions':
        return <QuickActionsWidget />;
      case 'social-feed':
        return <SocialFeedWidget />;
      case 'tips':
        return <TipsWidget />;
      case 'quests':
        return <QuestsWidget />;
      case 'creators':
        return <CreatorsWidget />;
      default:
        return null;
    }
  };

  const handleRefresh = useCallback(async () => {
    // Simulate refresh - in a real app this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Dashboard refreshed');
  }, []);

  const dashboardContent = (
    <div className="min-h-screen relative">
      <SEOHead 
        title="Dashboard - Your Creative Hub"
        description="Access your personalized NexusTouch dashboard. Track your creations, view stats, and manage your AI art journey."
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Dashboard', url: '/dashboard' },
        ]}
      />
      <StarfieldBackground />
      
      {/* Show top navigation only on mobile */}
      {isMobile && <Navigation />}
      
      {/* Desktop: Show sidebar header */}
      {!isMobile && <SidebarHeader />}
      
      {/* Onboarding Tour for new users */}
      <OnboardingTour />
      
      {/* Dashboard-specific tour */}
      <DashboardTour />
    
      {/* Main content - adjusted padding for sidebar on desktop */}
      <main className={`relative z-10 pb-20 md:pb-8 px-3 sm:px-4 ${isMobile ? 'pt-14 sm:pt-16' : 'pt-4'}`}>
        <div className="max-w-7xl">
            {/* Back Button and Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header - more compact */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">
                  Welcome to <span className="text-gradient">NexusTouch</span>
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Your AI-powered creative journey awaits
                </p>
              </div>
              
              {/* Edit Mode Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                {isEditing && (
                  <SciFiButton 
                    variant="ghost" 
                    size="sm"
                    onClick={resetLayout}
                    className="gap-1 h-7 sm:h-8 px-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">Reset</span>
                  </SciFiButton>
                )}
                <SciFiButton
                  variant={isEditing ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-1 h-7 sm:h-8 px-2"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">{isEditing ? 'Done' : 'Customize'}</span>
                </SciFiButton>
              </div>
            </div>

            {/* Hidden Widgets (show when editing) */}
            {isEditing && hiddenWidgets.length > 0 && (
              <SciFiFrame className="mb-3 p-3">
                <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2">
                  Hidden Widgets (click to show)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hiddenWidgets.map(widget => (
                    <SciFiButton
                      key={widget.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWidget(widget.id)}
                      className="gap-1 h-6 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {widget.title}
                    </SciFiButton>
                  ))}
                </div>
              </SciFiFrame>
            )}

            {/* Draggable Widget Grid - condensed */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleWidgets.map(w => w.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    {visibleWidgets.map(widget => (
                      <DashboardWidget
                        key={widget.id}
                        widget={widget}
                        isEditing={isEditing}
                        onRemove={() => toggleWidget(widget.id)}
                        onResize={(size) => resizeWidget(widget.id, size)}
                      >
                        {renderWidget(widget)}
                      </DashboardWidget>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Achievements Panel - condensed */}
            <div className="mb-3 sm:mb-4">
              <AchievementsPanel compact />
            </div>
          </div>
          
          {/* Performance Dashboard */}
          {settings.showPerformanceDashboard && <PerformanceDashboard />}
        </main>
        
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );

  return (
    <SwipeablePageWrapper>
      <PullToRefresh onRefresh={handleRefresh}>
        <SidebarLayout>
          {dashboardContent}
        </SidebarLayout>
      </PullToRefresh>
    </SwipeablePageWrapper>
  );
};

export default Dashboard;