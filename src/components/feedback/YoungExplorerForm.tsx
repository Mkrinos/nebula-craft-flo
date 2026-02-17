import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SciFiCard, SciFiCardContent, SciFiCardHeader } from '@/components/ui/sci-fi-card';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiProgress } from '@/components/ui/sci-fi-progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Rocket, Star, Sparkles, Palette, Gamepad2, Zap, 
  Monitor, Smartphone, Tablet, Clock, ArrowLeft, Trophy,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const feedbackSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string(),
  deviceType: z.string(),
  language: z.string(),
  ageGroup: z.string().optional(),
  experienceRating: z.number().min(1).max(5),
  featureRatings: z.object({
    visualDesign: z.number().min(1).max(10),
    easeOfUse: z.number().min(1).max(10),
    funFactor: z.number().min(1).max(10),
    performance: z.number().min(1).max(10),
    coolFactor: z.number().min(1).max(10),
  }),
  lovedFeatures: z.array(z.string()),
  lovedOther: z.string().optional(),
  improvements: z.array(z.string()),
  improvementsOther: z.string().optional(),
  dreamFeature: z.string().max(500).optional(),
  timeSpent: z.string().optional(),
  wouldReturn: z.string(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const lovedOptions = [
  { id: 'visuals', label: 'The sci-fi visuals', icon: '🎨' },
  { id: 'easeOfUse', label: 'How easy it was to use', icon: '🕹️' },
  { id: 'speed', label: 'The speed and smoothness', icon: '⚡' },
  { id: 'interactive', label: 'Interactive elements', icon: '🎮' },
  { id: 'animations', label: 'Animations and effects', icon: '🌟' },
  { id: 'overall', label: 'Overall experience', icon: '🚀' },
];

const improvementOptions = [
  { id: 'confusing', label: 'Some things were confusing', icon: '😕' },
  { id: 'slow', label: 'It felt slow sometimes', icon: '🐌' },
  { id: 'device', label: "Didn't work great on my device", icon: '📱' },
  { id: 'style', label: 'Visual style could be cooler', icon: '🎨' },
  { id: 'bugs', label: 'Found some bugs or glitches', icon: '🔧' },
];

const timeOptions = [
  { value: 'quick', label: 'Quick peek', detail: '< 5 minutes', icon: '👀' },
  { value: 'short', label: 'Short session', detail: '5-15 minutes', icon: '⏱️' },
  { value: 'good', label: 'Good exploration', detail: '15-30 minutes', icon: '🔍' },
  { value: 'deep', label: 'Deep dive', detail: '30+ minutes', icon: '🌊' },
];

const returnOptions = [
  { value: 'definitely', label: "Definitely! Can't wait!", icon: '🔥' },
  { value: 'probably', label: 'Yeah, probably', icon: '✅' },
  { value: 'maybe', label: 'Maybe, not sure', icon: '🤷' },
  { value: 'no', label: 'Probably not', icon: '👎' },
];

const ratingLabels = ['😵 Not Cool', '😕 Meh', '😐 Okay', '😊 Great', '😍 Amazing'];

interface YoungExplorerFormProps {
  onBack: () => void;
}

const YoungExplorerForm = ({ onBack }: YoungExplorerFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const generateSessionId = () => {
    return `EXP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      sessionId: generateSessionId(),
      timestamp: new Date().toISOString(),
      deviceType: getDeviceType(),
      language: navigator.language.split('-')[0] || 'en',
      ageGroup: '',
      experienceRating: 0,
      featureRatings: {
        visualDesign: 5,
        easeOfUse: 5,
        funFactor: 5,
        performance: 5,
        coolFactor: 5,
      },
      lovedFeatures: [],
      lovedOther: '',
      improvements: [],
      improvementsOther: '',
      dreamFeature: '',
      timeSpent: '',
      wouldReturn: '',
    },
  });

  const watchedValues = form.watch();

  // Calculate completion percentage
  const calculateProgress = useCallback(() => {
    let completed = 0;
    const total = 8;

    if (watchedValues.ageGroup) completed++;
    if (watchedValues.experienceRating > 0) completed++;
    if (Object.values(watchedValues.featureRatings || {}).some(v => v !== 5)) completed++;
    if (watchedValues.lovedFeatures?.length > 0) completed++;
    if (watchedValues.improvements?.length > 0 || watchedValues.improvementsOther) completed++;
    if (watchedValues.dreamFeature) completed++;
    if (watchedValues.timeSpent) completed++;
    if (watchedValues.wouldReturn) completed++;

    return Math.round((completed / total) * 100);
  }, [watchedValues]);

  const progress = calculateProgress();

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const data = form.getValues();
      localStorage.setItem('young-explorer-feedback-draft', JSON.stringify(data));
    }, 30000);

    return () => clearInterval(interval);
  }, [form]);

  // Load saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('young-explorer-feedback-draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Only restore if same session or recent
        const savedTime = new Date(data.timestamp).getTime();
        const now = Date.now();
        if (now - savedTime < 24 * 60 * 60 * 1000) { // Within 24 hours
          form.reset(data);
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, [form]);

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert feedback into database
      const { error } = await supabase
        .from('feedback_submissions')
        .insert({
          feedback_type: 'young_explorer',
          session_id: data.sessionId,
          device_type: data.deviceType,
          language: data.language,
          user_id: user?.id || null,
          age_group: data.ageGroup || null,
          experience_rating: data.experienceRating,
          feature_ratings: data.featureRatings,
          loved_features: data.lovedFeatures,
          loved_other: data.lovedOther || null,
          improvements: data.improvements,
          improvements_other: data.improvementsOther || null,
          dream_feature: data.dreamFeature || null,
          time_spent: data.timeSpent || null,
          would_return: data.wouldReturn,
        });
      
      if (error) {
        console.error('Failed to submit feedback:', error);
        throw error;
      }
      
      // Send email notification with all details (fire and forget)
      supabase.functions.invoke('send-feedback-notification', {
        body: {
          feedbackType: 'young_explorer',
          sessionId: data.sessionId,
          deviceType: data.deviceType,
          language: data.language,
          ageGroup: data.ageGroup,
          experienceRating: data.experienceRating,
          featureRatings: data.featureRatings,
          lovedFeatures: data.lovedFeatures,
          lovedOther: data.lovedOther,
          improvements: data.improvements,
          improvementsOther: data.improvementsOther,
          dreamFeature: data.dreamFeature,
          timeSpent: data.timeSpent,
          wouldReturn: data.wouldReturn,
        }
      }).catch(err => console.error('Email notification failed:', err));
      
      // Clear saved draft
      localStorage.removeItem('young-explorer-feedback-draft');
      
      setIsSubmitted(true);
      toast.success('🚀 Your ideas are now powering our starship!');
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Oops! Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const DeviceIcon = () => {
    const type = getDeviceType();
    if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-primary/20 border-2 border-primary">
          <Trophy className="w-12 h-12 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          🏆 Achievement Unlocked!
        </h2>
        <p className="text-xl text-neon-cyan font-display mb-4">Feedback Hero</p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Your ideas are now powering our starship! Thank you for helping us build the future together.
        </p>
        <SciFiButton variant="primary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Mission Control
        </SciFiButton>
      </motion.div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between mb-6">
        <SciFiButton type="button" variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </SciFiButton>
        <div className="flex-1 mx-4">
          <SciFiProgress value={progress} max={100} variant="gradient" size="sm" showValue />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          Mission Debrief: Your Adventure Report! 🚀
        </h1>
        <p className="text-muted-foreground">Share your experience and help shape the future!</p>
      </motion.div>

      {/* Section 1: Quick Info */}
      <SciFiCard variant="default" headerLabel="MISSION DATA" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-space-elevated/50 border border-border/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Session ID</p>
              <p className="text-xs font-mono text-neon-cyan">{watchedValues.sessionId}</p>
            </div>
            <div className="p-3 bg-space-elevated/50 border border-border/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date/Time</p>
              <p className="text-xs font-mono text-foreground">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-space-elevated/50 border border-border/30 rounded-lg flex items-center gap-2">
              <DeviceIcon />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Device</p>
                <p className="text-xs capitalize text-foreground">{watchedValues.deviceType}</p>
              </div>
            </div>
            <div className="p-3 bg-space-elevated/50 border border-border/30 rounded-lg">
              <Controller
                control={form.control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-auto p-0 border-0 bg-transparent">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">Language</p>
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-space-dark border-border z-50">
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="mr-2">{lang.flag}</span>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-sm font-display text-foreground mb-2 block">Age Group</Label>
            <Controller
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-space-elevated border-border">
                    <SelectValue placeholder="Select your age group" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-dark border-border z-50">
                    <SelectItem value="10-12">10-12 years old</SelectItem>
                    <SelectItem value="13-14">13-14 years old</SelectItem>
                    <SelectItem value="15-16">15-16 years old</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 2: Experience Rating */}
      <SciFiCard variant="default" headerLabel="EXPERIENCE" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
            How awesome was your experience?
          </h3>
          
          <Controller
            control={form.control}
            name="experienceRating"
            render={({ field }) => (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2 sm:gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={cn(
                        "relative w-10 h-10 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px] transition-all duration-300 transform touch-manipulation active:scale-95",
                        (hoveredStar >= star || field.value >= star) && "scale-110"
                      )}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onPointerDown={(e) => {
                        if (e.pointerType === "touch") {
                          e.preventDefault();
                          field.onChange(star);
                        }
                      }}
                      onClick={(e) => {
                        if (e.detail === 0) return;
                        field.onChange(star);
                      }}
                    >
                      <Star
                        className={cn(
                          "w-full h-full transition-all duration-300",
                          (hoveredStar >= star || field.value >= star)
                            ? "fill-primary text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]"
                            : "text-muted-foreground/30"
                        )}
                      />
                      {(hoveredStar >= star || field.value >= star) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 bg-primary/20 rounded-full blur-xl -z-10"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-display text-neon-cyan h-6">
                  {field.value > 0 ? ratingLabels[field.value - 1] : 'Tap a star to rate'}
                </p>
              </div>
            )}
          />
          {form.formState.errors.experienceRating && (
            <p className="text-destructive text-sm text-center mt-2">Please rate your experience!</p>
          )}
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 3: Feature Ratings */}
      <SciFiCard variant="default" headerLabel="FEATURES" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-6 text-center">
            Rate these features from 1-10
          </h3>
          
          <div className="space-y-6">
            {[
              { key: 'visualDesign', label: 'Visual Design', emoji: ['😕', '😍'] },
              { key: 'easeOfUse', label: 'Ease of Use', emoji: ['🤔', '😎'] },
              { key: 'funFactor', label: 'Fun Factor', emoji: ['😴', '🎉'] },
              { key: 'performance', label: 'Speed/Performance', emoji: ['🐌', '⚡'] },
              { key: 'coolFactor', label: 'Cool Factor', emoji: ['🥱', '🔥'] },
            ].map((feature) => (
              <Controller
                key={feature.key}
                control={form.control}
                name={`featureRatings.${feature.key as keyof FeedbackFormData['featureRatings']}`}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-display text-foreground">{feature.label}</Label>
                      <span className="text-lg font-display text-neon-cyan w-8 text-center">{field.value}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{feature.emoji[0]}</span>
                      <Slider
                        value={[field.value]}
                        onValueChange={([val]) => field.onChange(val)}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xl">{feature.emoji[1]}</span>
                    </div>
                  </div>
                )}
              />
            ))}
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 4: What Did You Love */}
      <SciFiCard variant="default" headerLabel="FAVORITES" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
            What did you love? (Select all that apply)
          </h3>
          
          <Controller
            control={form.control}
            name="lovedFeatures"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lovedOptions.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer min-h-[60px]",
                      field.value.includes(option.id)
                        ? "bg-primary/10 border-primary/50"
                        : "bg-space-elevated/30 border-border/30 hover:border-primary/30"
                    )}
                  >
                    <Checkbox
                      checked={field.value.includes(option.id)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...field.value, option.id]
                          : field.value.filter((v) => v !== option.id);
                        field.onChange(newValue);
                      }}
                    />
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          
          <div className="mt-4">
            <Controller
              control={form.control}
              name="lovedOther"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Other things you loved..."
                  className="bg-space-elevated border-border"
                />
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 5: What Could Be Better */}
      <SciFiCard variant="default" headerLabel="IMPROVEMENTS" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2 text-center">
            What could be better?
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">(Optional - help us improve!)</p>
          
          <Controller
            control={form.control}
            name="improvements"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {improvementOptions.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer min-h-[60px]",
                      field.value.includes(option.id)
                        ? "bg-accent/10 border-accent/50"
                        : "bg-space-elevated/30 border-border/30 hover:border-accent/30"
                    )}
                  >
                    <Checkbox
                      checked={field.value.includes(option.id)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...field.value, option.id]
                          : field.value.filter((v) => v !== option.id);
                        field.onChange(newValue);
                      }}
                    />
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          
          <div className="mt-4">
            <Controller
              control={form.control}
              name="improvementsOther"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Other suggestions..."
                  className="bg-space-elevated border-border"
                />
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 6: Dream Features */}
      <SciFiCard variant="default" headerLabel="DREAM FEATURES" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2 text-center">
            If you had a magic wand, what feature would you add? ✨
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Ideas: Holograms? Voice control? Creating avatars? Collaborating with friends?
          </p>
          
          <Controller
            control={form.control}
            name="dreamFeature"
            render={({ field }) => (
              <div className="relative">
                <Textarea
                  {...field}
                  placeholder="Think big! What would make this the coolest experience ever?"
                  className="min-h-[120px] bg-space-elevated border-border resize-none"
                  maxLength={500}
                />
                <p className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {field.value?.length || 0}/500
                </p>
              </div>
            )}
          />
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 7: Time Spent */}
      <SciFiCard variant="default" headerLabel="EXPLORATION TIME" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
            How long did you explore today?
          </h3>
          
          <Controller
            control={form.control}
            name="timeSpent"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                {timeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer min-h-[60px]",
                      field.value === option.value
                        ? "bg-neon-cyan/10 border-neon-cyan/50"
                        : "bg-space-elevated/30 border-border/30 hover:border-neon-cyan/30"
                    )}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="text-xl">{option.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.detail}</p>
                    </div>
                    {field.value === option.value && (
                      <CheckCircle2 className="w-4 h-4 text-neon-cyan ml-auto" />
                    )}
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 8: Would You Return */}
      <SciFiCard variant="default" headerLabel="FINAL THOUGHTS" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-4 text-center">
            Would you come back to explore more?
          </h3>
          
          <Controller
            control={form.control}
            name="wouldReturn"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                {returnOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-lg border transition-all cursor-pointer min-h-[60px] text-center",
                      field.value === option.value
                        ? "bg-primary/10 border-primary/50"
                        : "bg-space-elevated/30 border-border/30 hover:border-primary/30"
                    )}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
          {form.formState.errors.wouldReturn && (
            <p className="text-destructive text-sm text-center mt-2">Please let us know if you'd return!</p>
          )}
        </SciFiCardContent>
      </SciFiCard>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-4"
      >
        <SciFiButton
          type="submit"
          variant="primary"
          className="w-full min-h-[60px] text-lg font-display"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Launching...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Launch Feedback!
            </>
          )}
        </SciFiButton>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          Progress saves automatically every 30 seconds 💾
        </p>
      </motion.div>
    </form>
  );
};

export default YoungExplorerForm;
