import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiInput } from '@/components/ui/sci-fi-input';
import { Sparkles, ArrowRight, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function QuickGenerateWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleQuickGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) {
      toast.error('Sign in to generate images');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: prompt.trim(), saveToGallery: true }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.image) {
        setGeneratedImage(data.image);
        toast.success(data.cached ? 'From cache!' : 'Generated!');
      }
    } catch (err: any) {
      const msg = err.message || 'Generation failed';
      if (msg.toLowerCase().includes('credits')) {
        toast.error('Out of credits! Upgrade your plan.');
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {generatedImage ? (
        <div className="space-y-2">
          <div className="aspect-square rounded-lg overflow-hidden border border-border/30">
            <img src={generatedImage} alt={prompt} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-1.5">
            <SciFiButton 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => { setGeneratedImage(null); setPrompt(''); }}
            >
              New
            </SciFiButton>
            <SciFiButton 
              variant="primary" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => navigate('/creative-journey')}
            >
              Studio <ArrowRight className="w-3 h-3 ml-1" />
            </SciFiButton>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickGenerate()}
              placeholder="Describe your image..."
              className="w-full px-3 py-2 text-sm bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
              disabled={generating}
            />
          </div>
          <div className="flex gap-1.5">
            <SciFiButton
              variant="primary"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={handleQuickGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              {generating ? 'Creating...' : 'Generate'}
            </SciFiButton>
            <SciFiButton
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/creative-journey')}
            >
              Full Studio <ArrowRight className="w-3 h-3 ml-1" />
            </SciFiButton>
          </div>
          {!user && (
            <p className="text-[10px] text-muted-foreground text-center">
              Sign in to start generating AI art
            </p>
          )}
        </>
      )}
    </div>
  );
}
