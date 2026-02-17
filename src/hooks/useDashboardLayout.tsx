import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { WidgetConfig } from '@/components/dashboard/DashboardWidget';
import type { Json } from '@/integrations/supabase/types';

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'stats', type: 'stats', title: 'Your Progress', size: 'medium', isVisible: true },
  { id: 'quests', type: 'quests', title: 'Active Quests', size: 'medium', isVisible: true },
  { id: 'quick-actions', type: 'quick-actions', title: 'Quick Actions', size: 'medium', isVisible: true },
  { id: 'social-feed', type: 'social-feed', title: 'Community Highlights', size: 'medium', isVisible: true },
  { id: 'creators', type: 'creators', title: 'Top Creators', size: 'medium', isVisible: true },
  { id: 'tips', type: 'tips', title: 'Tips & Inspiration', size: 'medium', isVisible: true },
];

export function useDashboardLayout() {
  const { user } = useAuth();
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLayout();
    } else {
      setLayout(DEFAULT_LAYOUT);
      setLoading(false);
    }
  }, [user]);

  const fetchLayout = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_dashboard_layouts')
        .select('layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.layout) {
        // Validate and merge with defaults (in case new widgets were added)
        const savedLayout = data.layout as unknown as WidgetConfig[];
        const savedIds = new Set(savedLayout.map(w => w.id));
        const mergedLayout = [
          ...savedLayout,
          ...DEFAULT_LAYOUT.filter(w => !savedIds.has(w.id))
        ];
        setLayout(mergedLayout);
      } else {
        setLayout(DEFAULT_LAYOUT);
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
      setLayout(DEFAULT_LAYOUT);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = useCallback(async (newLayout: WidgetConfig[]) => {
    if (!user) return;

    try {
      // Check if layout exists
      const { data: existing } = await supabase
        .from('user_dashboard_layouts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const layoutJson = JSON.parse(JSON.stringify(newLayout)) as Json;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_dashboard_layouts')
          .update({
            layout: layoutJson,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_dashboard_layouts')
          .insert([{
            user_id: user.id,
            layout: layoutJson,
            updated_at: new Date().toISOString()
          }]);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    }
  }, [user]);

  const updateLayout = useCallback((newLayout: WidgetConfig[]) => {
    setLayout(newLayout);
    saveLayout(newLayout);
  }, [saveLayout]);

  const moveWidget = useCallback((activeId: string, overId: string) => {
    setLayout(prev => {
      const oldIndex = prev.findIndex(w => w.id === activeId);
      const newIndex = prev.findIndex(w => w.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newLayout = [...prev];
      const [removed] = newLayout.splice(oldIndex, 1);
      newLayout.splice(newIndex, 0, removed);
      
      saveLayout(newLayout);
      return newLayout;
    });
  }, [saveLayout]);

  const resizeWidget = useCallback((widgetId: string, size: 'small' | 'medium' | 'large') => {
    setLayout(prev => {
      const newLayout = prev.map(w => 
        w.id === widgetId ? { ...w, size } : w
      );
      saveLayout(newLayout);
      return newLayout;
    });
  }, [saveLayout]);

  const toggleWidget = useCallback((widgetId: string) => {
    setLayout(prev => {
      const newLayout = prev.map(w => 
        w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
      );
      saveLayout(newLayout);
      return newLayout;
    });
  }, [saveLayout]);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    saveLayout(DEFAULT_LAYOUT);
    toast.success('Layout reset to default');
  }, [saveLayout]);

  const visibleWidgets = layout.filter(w => w.isVisible);
  const hiddenWidgets = layout.filter(w => !w.isVisible);

  return {
    layout,
    visibleWidgets,
    hiddenWidgets,
    isEditing,
    setIsEditing,
    loading,
    moveWidget,
    resizeWidget,
    toggleWidget,
    resetLayout,
    updateLayout
  };
}