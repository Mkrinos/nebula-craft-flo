import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Shield, 
  Star, 
  ExternalLink, 
  Sparkles, 
  Image, 
  Music, 
  FileText, 
  Video,
  Palette,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  X,
  Plus,
  Send,
  Loader2,
  Heart
} from 'lucide-react';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton, sciFiButtonVariants } from '@/components/ui/sci-fi-button';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { SEOHead } from '@/components/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AIPlatform {
  id: string;
  name: string;
  description: string;
  educationalNote: string;
  category: 'image' | 'music' | 'text' | 'video' | 'multi';
  url: string;
  safetyRating: 'kid-safe' | 'parent-guided' | 'educational';
  ageRange: string;
  features: string[];
  logo: string;
  parentalControls: string;
}

const platforms: AIPlatform[] = [
  {
    id: 'dall-e-schools',
    name: 'DALL·E for Education',
    description: 'OpenAI\'s image generation tool with educational filters and classroom-friendly content moderation.',
    educationalNote: 'Teaches how AI interprets text descriptions to create visual art. Great for exploring the connection between language and imagery.',
    category: 'image',
    url: 'https://openai.com/education',
    safetyRating: 'educational',
    ageRange: '10+',
    features: ['Text-to-image', 'Content filters', 'Educational focus'],
    logo: '🎨',
    parentalControls: 'Managed accounts for educators, content filtering enabled by default, activity logs for teachers'
  },
  {
    id: 'canva-kids',
    name: 'Canva for Education',
    description: 'Design platform with AI-powered tools for creating presentations, posters, and digital art.',
    educationalNote: 'Introduces design principles while using AI to suggest layouts, colors, and elements. Perfect for school projects!',
    category: 'multi',
    url: 'https://www.canva.com/education/',
    safetyRating: 'kid-safe',
    ageRange: '8+',
    features: ['Design tools', 'AI suggestions', 'Templates', 'Collaboration'],
    logo: '🖼️',
    parentalControls: 'Teacher-managed classrooms, no external sharing without approval, COPPA and FERPA compliant'
  },
  {
    id: 'artbreeder',
    name: 'Artbreeder',
    description: 'Collaborative AI art platform where you can blend and evolve images to create unique artwork.',
    educationalNote: 'Demonstrates how AI can combine different visual elements. Shows the concept of "latent space" in a fun, interactive way.',
    category: 'image',
    url: 'https://www.artbreeder.com',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Image blending', 'Character creation', 'Landscape art'],
    logo: '🧬',
    parentalControls: 'NSFW filter on by default, community guidelines enforced, report system for inappropriate content'
  },
  {
    id: 'autodraw',
    name: 'AutoDraw by Google',
    description: 'Google\'s AI-powered drawing tool that turns your sketches into professional-looking drawings.',
    educationalNote: 'Shows how machine learning recognizes patterns in drawings. A great introduction to AI pattern recognition!',
    category: 'image',
    url: 'https://www.autodraw.com',
    safetyRating: 'kid-safe',
    ageRange: '6+',
    features: ['Sketch recognition', 'Free to use', 'No account needed'],
    logo: '✏️',
    parentalControls: 'No account required, no data storage, no social features - completely safe for all ages'
  },
  {
    id: 'soundraw',
    name: 'Soundraw',
    description: 'AI music generation platform that creates royalty-free background music based on your preferences.',
    educationalNote: 'Explores how AI understands musical patterns, moods, and genres to compose original music.',
    category: 'music',
    url: 'https://soundraw.io',
    safetyRating: 'parent-guided',
    ageRange: '12+',
    features: ['Music generation', 'Customizable', 'Royalty-free'],
    logo: '🎵',
    parentalControls: 'Account required, no social features, parental email verification for minors'
  },
  {
    id: 'storybird',
    name: 'Storybird',
    description: 'Creative writing platform with AI-assisted storytelling and beautiful artwork integration.',
    educationalNote: 'Combines creative writing with AI suggestions, helping young writers develop their storytelling skills.',
    category: 'text',
    url: 'https://storybird.com',
    safetyRating: 'kid-safe',
    ageRange: '8+',
    features: ['Story creation', 'Art library', 'Publishing'],
    logo: '📚',
    parentalControls: 'Teacher and parent accounts with full oversight, moderated publishing, COPPA compliant'
  },
  {
    id: 'scratch-ml',
    name: 'Machine Learning for Kids',
    description: 'Educational platform that teaches machine learning concepts through Scratch programming.',
    educationalNote: 'The best way to truly understand AI! Build your own AI projects while learning to code.',
    category: 'multi',
    url: 'https://machinelearningforkids.co.uk',
    safetyRating: 'educational',
    ageRange: '8+',
    features: ['Coding', 'AI training', 'Project-based learning'],
    logo: '🤖',
    parentalControls: 'Designed for classroom use, teacher oversight, no external data sharing'
  },
  {
    id: 'runwayml',
    name: 'Runway ML',
    description: 'Professional AI creative suite with video editing, image generation, and motion effects.',
    educationalNote: 'Shows the cutting edge of AI in creative industries. Great for understanding how professionals use AI tools.',
    category: 'video',
    url: 'https://runwayml.com',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Video editing', 'Gen-2 video', 'Motion tracking'],
    logo: '🎬',
    parentalControls: 'Age verification required, content moderation for generations, terms prohibit harmful content'
  },
  {
    id: 'adobe-firefly',
    name: 'Adobe Firefly',
    description: 'Adobe\'s family of creative AI models designed for safe, commercial use with content credentials.',
    educationalNote: 'Demonstrates responsible AI development with proper attribution and ethical content sourcing.',
    category: 'image',
    url: 'https://firefly.adobe.com',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Text effects', 'Generative fill', 'Content credentials'],
    logo: '🔥',
    parentalControls: 'Adobe ID required with age verification, built-in content credentials, trained on licensed content only'
  },
  {
    id: 'quick-draw',
    name: 'Quick, Draw! by Google',
    description: 'A game where you draw and AI tries to guess what you\'re drawing in 20 seconds.',
    educationalNote: 'A fun way to understand how neural networks learn to recognize shapes and patterns from millions of drawings!',
    category: 'image',
    url: 'https://quickdraw.withgoogle.com',
    safetyRating: 'kid-safe',
    ageRange: '6+',
    features: ['Drawing game', 'AI recognition', 'No account needed'],
    logo: '🎯',
    parentalControls: 'No account needed, no personal data collected, completely offline-safe, pure educational fun'
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo.AI',
    description: 'AI image generation platform with fine-tuned models for games, concept art, and character design.',
    educationalNote: 'Learn how AI models can be specialized for different art styles. Great for aspiring game designers!',
    category: 'image',
    url: 'https://leonardo.ai',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Game assets', 'Character design', 'Fine-tuned models'],
    logo: '🎮',
    parentalControls: 'NSFW content filter always on for free tier, community guidelines, content moderation team'
  },
  {
    id: 'suno-ai',
    name: 'Suno AI',
    description: 'Create original songs with AI - write lyrics or describe a song and hear it come to life!',
    educationalNote: 'Explores how AI can compose music and generate vocals. Perfect for understanding AI creativity in audio.',
    category: 'music',
    url: 'https://suno.com',
    safetyRating: 'parent-guided',
    ageRange: '12+',
    features: ['Song creation', 'Lyrics generation', 'Multiple genres'],
    logo: '🎤',
    parentalControls: 'Content filters for lyrics, no explicit content generation, community reporting system'
  },
  {
    id: 'teachable-machine',
    name: 'Teachable Machine by Google',
    description: 'Train your own machine learning models without coding. Teach the computer to recognize images, sounds, and poses!',
    educationalNote: 'The most hands-on way to understand how AI learns! Create your own image or sound classifier in minutes.',
    category: 'multi',
    url: 'https://teachablemachine.withgoogle.com',
    safetyRating: 'kid-safe',
    ageRange: '8+',
    features: ['No coding', 'Image recognition', 'Sound classification', 'Pose detection'],
    logo: '🧠',
    parentalControls: 'No account required, all processing in browser, no data uploaded, perfect for classroom use'
  },
  {
    id: 'pika-labs',
    name: 'Pika Labs',
    description: 'AI video generator that creates short videos from text descriptions or images.',
    educationalNote: 'See how AI can bring still images to life! Great for understanding AI video generation.',
    category: 'video',
    url: 'https://pika.art',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Text-to-video', 'Image animation', 'Video editing'],
    logo: '📹',
    parentalControls: 'Discord-based with moderation bots, content policy enforcement, age-gated access'
  },
  {
    id: 'udio',
    name: 'Udio',
    description: 'AI music creation platform that generates full songs with vocals in any genre you can imagine.',
    educationalNote: 'Discover how AI understands different music styles and creates coherent songs with lyrics!',
    category: 'music',
    url: 'https://udio.com',
    safetyRating: 'parent-guided',
    ageRange: '12+',
    features: ['Full songs', 'Any genre', 'Vocal synthesis'],
    logo: '🎹',
    parentalControls: 'Lyric content filtering, terms of service prohibiting harmful content, age verification'
  },
  {
    id: 'krita',
    name: 'Krita with AI',
    description: 'Free professional painting software with AI-powered image generation and editing plugins.',
    educationalNote: 'Learn digital painting while exploring how AI can assist artists. Great for serious young artists!',
    category: 'image',
    url: 'https://krita.org',
    safetyRating: 'kid-safe',
    ageRange: '10+',
    features: ['Digital painting', 'Free & open source', 'AI plugins'],
    logo: '🖌️',
    parentalControls: 'Desktop software with no internet required, open-source and transparent, no data collection'
  },
  {
    id: 'ai-dungeon',
    name: 'AI Dungeon',
    description: 'Interactive storytelling game where AI creates endless adventure possibilities based on your choices.',
    educationalNote: 'Experience how large language models can generate creative narratives. Every playthrough is unique!',
    category: 'text',
    url: 'https://play.aidungeon.io',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Interactive stories', 'Endless adventures', 'Custom scenarios'],
    logo: '🐉',
    parentalControls: 'Safe mode for family-friendly content, content filters, parental controls in account settings'
  },
  {
    id: 'clipchamp',
    name: 'Clipchamp by Microsoft',
    description: 'Free video editor with AI features like auto-captions, text-to-speech, and smart editing.',
    educationalNote: 'Learn video editing with AI assistance. Great for creating school presentations and YouTube videos!',
    category: 'video',
    url: 'https://clipchamp.com',
    safetyRating: 'kid-safe',
    ageRange: '10+',
    features: ['Auto captions', 'Text-to-speech', 'Free editing'],
    logo: '🎥',
    parentalControls: 'Microsoft account family settings, no social features, COPPA compliant for education'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Advanced AI voice synthesis that can clone voices and generate natural-sounding speech.',
    educationalNote: 'Understand the power and responsibility of AI voice technology. Create audiobooks and voiceovers!',
    category: 'music',
    url: 'https://elevenlabs.io',
    safetyRating: 'parent-guided',
    ageRange: '13+',
    features: ['Voice cloning', 'Text-to-speech', 'Multiple languages'],
    logo: '🔊',
    parentalControls: 'Account required, voice cloning consent verification, content policy against misuse'
  },
  {
    id: 'craiyon',
    name: 'Craiyon (DALL·E Mini)',
    description: 'Free AI image generator that anyone can use - no account needed! Create fun images from text.',
    educationalNote: 'A great first experience with AI art. See how the same prompt can create different results each time!',
    category: 'image',
    url: 'https://www.craiyon.com',
    safetyRating: 'kid-safe',
    ageRange: '8+',
    features: ['Free to use', 'No account', 'Quick generation'],
    logo: '🖍️',
    parentalControls: 'Built-in content filter, banned word list, no user accounts or data storage'
  }
];

const categoryIcons = {
  image: Image,
  music: Music,
  text: FileText,
  video: Video,
  multi: Palette
};

const categoryLabels = {
  image: 'Image Generation',
  music: 'Music & Audio',
  text: 'Writing & Stories',
  video: 'Video & Animation',
  multi: 'Multi-Purpose'
};

const safetyColors = {
  'kid-safe': 'bg-green-500/20 text-green-400 border-green-500/30',
  'parent-guided': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'educational': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const safetyIcons = {
  'kid-safe': CheckCircle2,
  'parent-guided': AlertTriangle,
  'educational': BookOpen
};

const safetyLabels = {
  'kid-safe': 'Kid-Safe',
  'parent-guided': 'Parent Guided',
  'educational': 'Educational'
};

export default function AIEcosystem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<AIPlatform | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    platformName: '',
    platformUrl: '',
    category: '',
    ageRange: '',
    description: '',
    whyRecommended: ''
  });

  // Fetch user favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['platform-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('platform_favorites')
        .select('platform_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(f => f.platform_id);
    },
    enabled: !!user
  });

  // Add favorite mutation
  const addFavorite = useMutation({
    mutationFn: async (platformId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase.from('platform_favorites').insert({
        user_id: user.id,
        platform_id: platformId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-favorites'] });
      toast.success('Added to favorites!');
    },
    onError: () => toast.error('Failed to add favorite')
  });

  // Remove favorite mutation
  const removeFavorite = useMutation({
    mutationFn: async (platformId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('platform_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('platform_id', platformId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-favorites'] });
      toast.success('Removed from favorites');
    },
    onError: () => toast.error('Failed to remove favorite')
  });

  const toggleFavorite = (platformId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to save favorites');
      return;
    }
    if (favorites.includes(platformId)) {
      removeFavorite.mutate(platformId);
    } else {
      addFavorite.mutate(platformId);
    }
  };

  const filteredPlatforms = platforms.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesFavorites = !showFavoritesOnly || favorites.includes(p.id);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory && matchesFavorites;
    
    const matchesSearch = 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.features.some(f => f.toLowerCase().includes(query)) ||
      p.educationalNote.toLowerCase().includes(query);
    
    return matchesCategory && matchesFavorites && matchesSearch;
  });

  const handleVisit = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionForm.platformName || !suggestionForm.category || !suggestionForm.ageRange || !suggestionForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('platform_suggestions').insert({
        user_id: user?.id || null,
        platform_name: suggestionForm.platformName,
        platform_url: suggestionForm.platformUrl || null,
        category: suggestionForm.category,
        age_range: suggestionForm.ageRange,
        description: suggestionForm.description,
        why_recommended: suggestionForm.whyRecommended || null
      });

      if (error) throw error;

      toast.success('Thank you! Your suggestion has been submitted for review.');
      setSuggestionForm({
        platformName: '',
        platformUrl: '',
        category: '',
        ageRange: '',
        description: '',
        whyRecommended: ''
      });
      setSuggestDialogOpen(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background pb-24 md:pb-8 focus:outline-none">
      <SEOHead 
        title="AI Creative Ecosystem - Discover Age-Appropriate AI Tools"
        description="Explore curated, age-appropriate AI creative platforms. Learn about generative AI tools for image generation, music creation, writing, and more."
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/30 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                AI Creative Ecosystem
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-6">
              Discover age-appropriate AI tools from around the world. Learn how generative AI is transforming creativity!
            </p>
            
            {/* Educational Callout */}
            <SciFiFrame className="bg-card/50 p-4 max-w-xl mx-auto">
              <div className="flex items-start gap-3 text-left">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">What is Generative AI?</h3>
                  <p className="text-sm text-muted-foreground">
                    Generative AI creates new content—images, music, stories, and more—by learning patterns from existing data. 
                    These tools help artists, writers, and creators bring their imagination to life!
                  </p>
                </div>
              </div>
            </SciFiFrame>

            {/* Suggest Platform Button */}
            <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
              <DialogTrigger asChild>
                <TouchTriggerButton className={sciFiButtonVariants({ variant: 'ghost' }) + ' mt-4'}>
                  <Plus className="w-4 h-4 mr-2 pointer-events-none" />
                  <span className="pointer-events-none">Suggest a Platform</span>
                </TouchTriggerButton>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Suggest a Platform
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Know an age-appropriate AI tool we should add? Share it with us!
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name *</Label>
                    <Input
                      id="platformName"
                      placeholder="e.g., Magic AI Art"
                      value={suggestionForm.platformName}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, platformName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platformUrl">Website URL</Label>
                    <Input
                      id="platformUrl"
                      placeholder="https://..."
                      value={suggestionForm.platformUrl}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, platformUrl: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={suggestionForm.category}
                      onValueChange={(value) => setSuggestionForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image Generation</SelectItem>
                        <SelectItem value="music">Music & Audio</SelectItem>
                        <SelectItem value="text">Writing & Stories</SelectItem>
                        <SelectItem value="video">Video & Animation</SelectItem>
                        <SelectItem value="multi">Multi-Purpose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Recommended Age Range *</Label>
                    <Select
                      value={suggestionForm.ageRange}
                      onValueChange={(value) => setSuggestionForm(prev => ({ ...prev, ageRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6+">6+ (Young Kids)</SelectItem>
                        <SelectItem value="8+">8+ (Kids)</SelectItem>
                        <SelectItem value="10+">10+ (Tweens)</SelectItem>
                        <SelectItem value="12+">12+ (Pre-teens)</SelectItem>
                        <SelectItem value="13+">13+ (Teens)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this platform do?"
                      value={suggestionForm.description}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whyRecommended">Why do you recommend it?</Label>
                    <Textarea
                      id="whyRecommended"
                      placeholder="What makes it great for young creators?"
                      value={suggestionForm.whyRecommended}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, whyRecommended: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <SciFiButton 
                    className="w-full" 
                    onClick={handleSuggestionSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Suggestion
                      </>
                    )}
                  </SciFiButton>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </div>

      {/* Safety Legend */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="text-muted-foreground">Safety Ratings:</span>
          {Object.entries(safetyLabels).map(([key, label]) => {
            const Icon = safetyIcons[key as keyof typeof safetyIcons];
            return (
              <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${safetyColors[key as keyof typeof safetyColors]}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Category Tabs */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Search Input */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search platforms, features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs with Favorites Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-auto">
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent justify-center">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
                <Sparkles className="w-4 h-4 mr-1.5" />
                All Platforms
              </TabsTrigger>
              {Object.entries(categoryLabels).map(([key, label]) => {
                const Icon = categoryIcons[key as keyof typeof categoryIcons];
                return (
                  <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary/20">
                    <Icon className="w-4 h-4 mr-1.5" />
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          
          {user && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                showFavoritesOnly 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'bg-card/50 text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-pink-400' : ''}`} />
              Favorites {favorites.length > 0 && `(${favorites.length})`}
            </button>
          )}
        </div>

        {/* Results count */}
        {searchQuery && (
          <p className="text-center text-sm text-muted-foreground">
            Found {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''} 
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}
      </div>

      {/* Personalized Recommendations */}
      {user && favorites.length > 0 && !showFavoritesOnly && activeCategory === 'all' && !searchQuery && (
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Recommended For You
            </h2>
            <p className="text-sm text-muted-foreground">Based on your favorites</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              // Get categories from favorites
              const favoriteCategories = new Set(
                platforms
                  .filter(p => favorites.includes(p.id))
                  .map(p => p.category)
              );
              // Recommend similar platforms not yet favorited
              return platforms
                .filter(p => favoriteCategories.has(p.category) && !favorites.includes(p.id))
                .slice(0, 3)
                .map(platform => (
                  <SciFiFrame 
                    key={platform.id}
                    className="bg-gradient-to-br from-primary/10 to-cyan-500/10 hover:from-primary/20 hover:to-cyan-500/20 transition-all cursor-pointer"
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl shrink-0">
                        {platform.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{platform.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{platform.description}</p>
                      </div>
                      <Badge variant="outline" className={safetyColors[platform.safetyRating]}>
                        {safetyLabels[platform.safetyRating]}
                      </Badge>
                    </div>
                  </SciFiFrame>
                ));
            })()}
          </div>
        </div>
      )}

      {/* Platforms Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlatforms.map((platform, index) => {
            const SafetyIcon = safetyIcons[platform.safetyRating];
            
            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SciFiFrame 
                  className="h-full bg-card/50 hover:bg-card/80 transition-all cursor-pointer group"
                  onClick={() => setSelectedPlatform(platform)}
                >
                  <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-2xl">
                          {platform.logo}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {platform.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Ages {platform.ageRange}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={safetyColors[platform.safetyRating]}>
                        <SafetyIcon className="w-3 h-3 mr-1" />
                        {safetyLabels[platform.safetyRating]}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {platform.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5">
                      {platform.features.slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Parental Controls */}
                    <div className="flex items-start gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                      <Shield className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-green-300 line-clamp-2">
                        {platform.parentalControls}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(platform.id, e)}
                          className={`p-1.5 rounded-full transition-all ${
                            favorites.includes(platform.id)
                              ? 'text-pink-400 bg-pink-500/20'
                              : 'text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10'
                          }`}
                          title={favorites.includes(platform.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(platform.id) ? 'fill-pink-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlatform(platform);
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Learn more
                        </button>
                      </div>
                      <SciFiButton
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVisit(platform.url);
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Visit
                      </SciFiButton>
                    </div>
                  </div>
                </SciFiFrame>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Platform Detail Modal */}
      {selectedPlatform && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setSelectedPlatform(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <SciFiFrame className="bg-card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center text-3xl">
                    {selectedPlatform.logo}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedPlatform.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={safetyColors[selectedPlatform.safetyRating]}>
                        {(() => {
                          const Icon = safetyIcons[selectedPlatform.safetyRating];
                          return <Icon className="w-3 h-3 mr-1" />;
                        })()}
                        {safetyLabels[selectedPlatform.safetyRating]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Ages {selectedPlatform.ageRange}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground">{selectedPlatform.description}</p>

              {/* Parental Controls */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-400 mb-1">Parental Controls</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlatform.parentalControls}</p>
                  </div>
                </div>
              </div>

              {/* Educational Note */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-cyan-400 mb-1">What You'll Learn</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlatform.educationalNote}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.features.map((feature, i) => (
                    <Badge key={i} variant="secondary">
                      <Star className="w-3 h-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Category:</span>
                <Badge variant="outline">
                  {(() => {
                    const Icon = categoryIcons[selectedPlatform.category];
                    return <Icon className="w-3 h-3 mr-1" />;
                  })()}
                  {categoryLabels[selectedPlatform.category]}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border/30">
                <SciFiButton
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setSelectedPlatform(null)}
                >
                  Close
                </SciFiButton>
                <SciFiButton
                  className="flex-1"
                  onClick={() => handleVisit(selectedPlatform.url)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Platform
                </SciFiButton>
              </div>
            </SciFiFrame>
          </motion.div>
        </motion.div>
      )}

      {/* Educational Footer */}
      <div className="container mx-auto px-4 py-8">
        <SciFiFrame className="bg-gradient-to-r from-primary/10 to-cyan-500/10 p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Stay Safe While Exploring
              </h3>
              <p className="text-muted-foreground text-sm">
                Always explore these platforms with a parent or guardian. Never share personal information, 
                and remember that AI-generated content should be used responsibly and ethically. 
                Have fun creating!
              </p>
            </div>
            <Shield className="w-10 h-10 text-cyan-400 shrink-0" />
          </div>
        </SciFiFrame>
      </div>
    </main>
  );
}
