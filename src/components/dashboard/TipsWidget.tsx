import { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Star, RefreshCw } from 'lucide-react';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';

const tips = [
  {
    category: 'Prompts',
    tip: 'Use detailed descriptions including lighting, mood, and style for better results.',
    icon: Lightbulb
  },
  {
    category: 'Personas',
    tip: 'Each persona has unique artistic styles - try them all to find your favorite!',
    icon: Star
  },
  {
    category: 'Community',
    tip: 'Share your best creations with the community to earn followers and inspire others.',
    icon: Sparkles
  },
  {
    category: 'Streaks',
    tip: 'Create daily to build your streak and unlock special achievements!',
    icon: RefreshCw
  },
  {
    category: 'Quality',
    tip: 'Try different aspect ratios - portrait works great for characters, landscape for scenes.',
    icon: Star
  }
];

const dailyPrompts = [
  '🌌 "A cosmic garden where flowers are made of stardust"',
  '🏰 "An underwater castle with bioluminescent creatures"',
  '🤖 "A friendly robot teaching art to woodland animals"',
  '🌈 "A rainbow bridge connecting two floating islands"',
  '🐉 "A baby dragon learning to fly with butterfly friends"'
];

export function TipsWidget() {
  const [currentTip, setCurrentTip] = useState(0);
  const [dailyPrompt, setDailyPrompt] = useState('');

  useEffect(() => {
    // Rotate tip every 10 seconds
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 10000);

    // Set daily prompt based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyPrompt(dailyPrompts[dayOfYear % dailyPrompts.length]);

    return () => clearInterval(interval);
  }, []);

  const tip = tips[currentTip];
  const TipIcon = tip.icon;

  return (
    <div className="space-y-3 px-1">
      {/* Daily Prompt */}
      <div className="p-3 border border-neon-cyan/30 bg-neon-cyan/5 rounded-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-neon-cyan flex-shrink-0" />
          <span className="text-[10px] font-display uppercase tracking-wider text-neon-cyan">Daily Prompt</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dailyPrompt}</p>
      </div>

      {/* Rotating Tip */}
      <div className="p-3 border border-border/30 bg-space-dark/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-accent/30 bg-accent/10 flex-shrink-0 rounded">
            <TipIcon className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <SciFiBadge variant="default" size="sm" className="mb-1 text-[9px] py-0.5 px-1.5">{tip.category}</SciFiBadge>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
          </div>
        </div>
      </div>

      {/* Tip navigation dots */}
      <div className="flex justify-center gap-1 pt-1">
        {tips.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentTip(i)}
            className="w-10 h-10 flex items-center justify-center touch-manipulation active:scale-90 transition-transform"
            aria-label={`Go to tip ${i + 1}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentTip 
                ? 'bg-neon-cyan shadow-[0_0_8px_hsl(var(--neon-cyan))]' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}