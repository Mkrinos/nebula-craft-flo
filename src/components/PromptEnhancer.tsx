import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Wand2, Loader2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromptEnhancerProps {
  prompt: string;
  onEnhance: (enhancedPrompt: string) => void;
}

const PromptEnhancer = ({ prompt, onEnhance }: PromptEnhancerProps) => {
  const { currentLanguage, getLanguageInfo } = useLanguage();
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first!');
      return;
    }

    setEnhancing(true);
    setEnhancedPrompt(null);

    const langInfo = getLanguageInfo(currentLanguage);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: { 
          prompt: prompt.trim(),
          language: currentLanguage,
          languageName: langInfo.name
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.enhancedPrompt) {
        setEnhancedPrompt(data.enhancedPrompt);
        toast.success('Prompt enhanced! Click "Use This" to apply it.');
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast.error(error.message || 'Failed to enhance prompt');
    } finally {
      setEnhancing(false);
    }
  };

  const applyEnhancement = () => {
    if (enhancedPrompt) {
      onEnhance(enhancedPrompt);
      setEnhancedPrompt(null);
      toast.success('Enhanced prompt applied!');
    }
  };

  const tips = [
    "🎨 Add colors: 'a red dragon' → 'a crimson dragon with golden scales'",
    "✨ Add mood: 'a castle' → 'a mysterious castle shrouded in mist'",
    "🌟 Add style: 'a cat' → 'an anime-style cat with big sparkly eyes'",
    "🌈 Add setting: 'a robot' → 'a friendly robot in a neon-lit city'",
  ];

  return (
    <div className="space-y-3">
      {/* Enhance Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnhance}
          disabled={enhancing || !prompt.trim()}
          className="gap-2 flex-1 border-primary/50 hover:border-primary hover:bg-primary/10"
        >
          {enhancing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              ✨ Make My Prompt Better!
            </>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTips(!showTips)}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <Lightbulb className="w-4 h-4" />
          Tips
          {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* Tips Section */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Pro Tips for Amazing Prompts:
              </p>
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Result */}
      <AnimatePresence>
        {enhancedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-primary/10 border border-primary/30"
          >
            <div className="flex items-start gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Enhanced Prompt:
                </p>
                <p className="text-sm text-foreground/90">
                  {enhancedPrompt}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="neon"
                size="sm"
                onClick={applyEnhancement}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Use This!
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnhancedPrompt(null)}
              >
                Keep Original
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptEnhancer;
