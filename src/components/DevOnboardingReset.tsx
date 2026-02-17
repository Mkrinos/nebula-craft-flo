import { RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Dev-only button to reset onboarding wizard state for testing.
 * Only renders in development mode.
 */
export function DevOnboardingReset() {
  const { user } = useAuth();

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const handleReset = async () => {
    if (user) {
      // Clear localStorage dismissal
      localStorage.removeItem(`wizard_dismissed_${user.id}`);
      
      // Reset database onboarding status
      await supabase
        .from('user_onboarding')
        .update({ is_complete: false, completed_steps: [] })
        .eq('user_id', user.id);
    }
    
    toast.success('Onboarding reset! Refreshing...');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <button
      onClick={handleReset}
      className="fixed bottom-20 left-4 z-[9999] flex items-center gap-2 px-3 py-2 text-xs font-mono bg-destructive/80 text-destructive-foreground rounded-md hover:bg-destructive transition-colors shadow-lg"
      title="Reset Onboarding (Dev Only)"
    >
      <RotateCcw className="w-3 h-3" />
      Reset Wizard
    </button>
  );
}
