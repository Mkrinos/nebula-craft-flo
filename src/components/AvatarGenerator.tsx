import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { Sparkles, Camera, Loader2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarGeneratorProps {
  onAvatarGenerated?: (url: string) => void;
  className?: string;
}

const AVATAR_STYLES = [
  { id: 'cyberpunk', label: 'Cyberpunk', prompt: 'cyberpunk style avatar portrait, neon lighting, futuristic' },
  { id: 'anime', label: 'Anime', prompt: 'anime style avatar portrait, colorful, expressive' },
  { id: 'fantasy', label: 'Fantasy', prompt: 'fantasy art style avatar portrait, magical, ethereal glow' },
  { id: 'pixel', label: 'Pixel Art', prompt: 'pixel art style avatar, retro gaming aesthetic, 16-bit' },
  { id: 'watercolor', label: 'Watercolor', prompt: 'watercolor painting style portrait, soft colors, artistic' },
  { id: 'minimal', label: 'Minimal', prompt: 'minimalist avatar illustration, clean lines, modern design' },
];

export default function AvatarGenerator({ onAvatarGenerated, className }: AvatarGeneratorProps) {
  const { user } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState(AVATAR_STYLES[0]);
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Sign in to generate avatars');
      return;
    }

    setGenerating(true);
    try {
      const fullPrompt = `Create a profile avatar: ${description || 'a creative person'}. Style: ${selectedStyle.prompt}. Square format, centered face/character, suitable for a profile picture.`;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: fullPrompt, saveToGallery: false }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.image) {
        setGeneratedAvatar(data.image);
        toast.success('Avatar generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate avatar');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsAvatar = async () => {
    if (!generatedAvatar || !user) return;
    
    setSaving(true);
    try {
      // Upload to storage
      const base64Data = generatedAvatar.split(',')[1];
      if (!base64Data) {
        // It's a URL, just save it directly
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: generatedAvatar, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (error) throw error;
      } else {
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `${user.id}/avatar-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('generated-images')
          .upload(fileName, binaryData, { contentType: 'image/png', upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('generated-images')
          .getPublicUrl(fileName);

        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) throw error;
      }

      toast.success('Avatar saved to your profile!');
      onAvatarGenerated?.(generatedAvatar);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 block">
            Describe yourself (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. adventurous artist with blue hair"
            className="w-full px-3 py-2 text-sm bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 block">
            Style
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  selectedStyle.id === style.id
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border/30 text-muted-foreground hover:border-primary/50'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {generatedAvatar ? (
          <div className="space-y-3">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-primary/50">
              <img src={generatedAvatar} alt="Generated avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 justify-center">
              <SciFiButton
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => { setGeneratedAvatar(null); handleGenerate(); }}
                disabled={generating}
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </SciFiButton>
              <SciFiButton
                variant="primary"
                size="sm"
                className="gap-1"
                onClick={handleSaveAsAvatar}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Use as Avatar
              </SciFiButton>
            </div>
          </div>
        ) : (
          <SciFiButton
            variant="primary"
            size="sm"
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? 'Generating Avatar...' : 'Generate AI Avatar'}
          </SciFiButton>
        )}
      </div>
    </div>
  );
}
