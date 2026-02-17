import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SciFiCard, SciFiCardContent } from '@/components/ui/sci-fi-card';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiProgress } from '@/components/ui/sci-fi-progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Heart, Star, Clock, GripVertical,
  CheckCircle2, Send, Shield, Eye, Lock, Users as UsersIcon,
  Database, Timer, Filter, FileText, Activity, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const parentSchema = z.object({
  // Section 1: Background
  sessionId: z.string(),
  timestamp: z.string(),
  language: z.string(),
  childAgeGroup: z.string().optional(),
  heardFrom: z.string().optional(),
  
  // Section 2: Overall Impression
  overallSatisfaction: z.number().min(1).max(5),
  firstImpressions: z.array(z.string()),
  firstImpressionsOther: z.string().optional(),
  
  // Section 3: Value Assessment
  expectedPrice: z.string(),
  primaryValue: z.array(z.string()).max(3),
  primaryValueOther: z.string().optional(),
  
  // Section 4: Safety & Appropriateness
  concernRatings: z.object({
    contentAppropriateness: z.number().min(1).max(5),
    screenTime: z.number().min(1).max(5),
    privacyProtection: z.number().min(1).max(5),
    socialInteractions: z.number().min(1).max(5),
    dataCollection: z.number().min(1).max(5),
  }),
  safetyFeatureRanking: z.array(z.string()),
  
  // Section 5: Child's Engagement
  childEngagement: z.array(z.string()),
  timeSpent: z.string().optional(),
  
  // Section 6: Competitive Comparison
  otherPlatforms: z.array(z.string()),
  otherPlatformsOther: z.string().optional(),
  platformComparison: z.string().max(500).optional(),
  
  // Section 7: Feature Priorities
  featurePriorities: z.array(z.string()),
  
  // Section 8: Likelihood to Adopt
  signupLikelihood: z.string(),
  recommendLikelihood: z.string().optional(),
  
  // Section 9: Open Feedback
  questionsAndConcerns: z.string().max(1000).optional(),
  featureSuggestions: z.string().max(500).optional(),
  
  // Section 10: Follow-Up
  participationType: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  contactFrequency: z.string().optional(),
});

type ParentFormData = z.infer<typeof parentSchema>;

const firstImpressionOptions = [
  { id: 'engaging', label: 'Engaging and age-appropriate' },
  { id: 'educational', label: 'Educationally valuable' },
  { id: 'safe', label: 'Safe and supervised' },
  { id: 'wellDesigned', label: 'Well-designed interface' },
  { id: 'innovative', label: 'Innovative approach' },
];

const priceOptions = [
  { value: 'under10', label: 'Under $10' },
  { value: '10-20', label: '$10-20' },
  { value: '20-30', label: '$20-30' },
  { value: '30-40', label: '$30-40' },
  { value: '40-50', label: '$40-50' },
  { value: 'over50', label: 'Over $50' },
  { value: 'wouldNotPay', label: 'I would not pay for this' },
];

const primaryValueOptions = [
  { id: 'education', label: 'Educational content and skill development' },
  { id: 'safety', label: 'Safe, supervised digital environment' },
  { id: 'creative', label: 'Creative expression tools' },
  { id: 'techLiteracy', label: 'Technology literacy advancement' },
  { id: 'alternative', label: 'Alternative to passive screen time' },
  { id: 'social', label: 'Social interaction with peers' },
  { id: 'portfolio', label: 'Portfolio building for future' },
];

const safetyFeatures = [
  { id: 'timeControls', label: 'Usage time controls', icon: Timer },
  { id: 'contentFiltering', label: 'Content filtering', icon: Filter },
  { id: 'progressReports', label: 'Progress reports', icon: FileText },
  { id: 'privacySettings', label: 'Privacy settings', icon: Lock },
  { id: 'activityMonitoring', label: 'Activity monitoring', icon: Activity },
  { id: 'parentalOversight', label: 'Parental oversight tools', icon: Settings },
];

const engagementOptions = [
  { id: 'highlyEngaged', label: 'Highly engaged and focused' },
  { id: 'moderateInterest', label: 'Moderate interest' },
  { id: 'easilyDistracted', label: 'Easily distracted' },
  { id: 'neededHelp', label: 'Needed help frequently' },
  { id: 'independent', label: 'Navigated independently' },
  { id: 'askedAgain', label: 'Asked to use it again' },
  { id: 'sharedExcitement', label: 'Shared excitement with family' },
];

const competitorPlatforms = [
  { id: 'roblox', label: 'Roblox' },
  { id: 'minecraft', label: 'Minecraft' },
  { id: 'khanAcademy', label: 'Khan Academy' },
  { id: 'youtubeKids', label: 'YouTube Kids' },
  { id: 'duolingo', label: 'Duolingo' },
  { id: 'educationalApps', label: 'Other educational apps' },
  { id: 'gamingPlatforms', label: 'Gaming platforms' },
  { id: 'creativeTools', label: 'Creative tools (Canva, etc.)' },
  { id: 'none', label: 'None' },
];

const featurePriorityOptions = [
  { id: 'curriculum', label: 'Educational curriculum alignment' },
  { id: 'skillTracking', label: 'Skill development tracking' },
  { id: 'safeSocial', label: 'Safe social features' },
  { id: 'creativeTools', label: 'Creative project tools' },
  { id: 'parentalControls', label: 'Parental controls and reporting' },
  { id: 'multiChild', label: 'Multi-child account management' },
  { id: 'portfolios', label: 'Progress portfolios' },
];

const signupOptions = [
  { value: 'definitely', label: 'Definitely will sign up' },
  { value: 'veryLikely', label: 'Very likely' },
  { value: 'somewhatLikely', label: 'Somewhat likely' },
  { value: 'neutral', label: 'Neutral/Unsure' },
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'definitelyNot', label: 'Definitely not' },
];

const recommendOptions = [
  { value: 'activelyRecommend', label: 'Would actively recommend' },
  { value: 'ifAsked', label: 'Would recommend if asked' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'wouldNot', label: 'Would not recommend' },
];

interface ParentGuardianFormProps {
  onBack: () => void;
}

const ParentGuardianForm = ({ onBack }: ParentGuardianFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [safetyRanking, setSafetyRanking] = useState(safetyFeatures.map(f => f.id));
  const [featureRanking, setFeatureRanking] = useState(featurePriorityOptions.map(f => f.id));

  const generateSessionId = () => {
    return `PG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const form = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      sessionId: generateSessionId(),
      timestamp: new Date().toISOString(),
      language: navigator.language.split('-')[0] || 'en',
      childAgeGroup: '',
      heardFrom: '',
      overallSatisfaction: 0,
      firstImpressions: [],
      firstImpressionsOther: '',
      expectedPrice: '',
      primaryValue: [],
      primaryValueOther: '',
      concernRatings: {
        contentAppropriateness: 3,
        screenTime: 3,
        privacyProtection: 3,
        socialInteractions: 3,
        dataCollection: 3,
      },
      safetyFeatureRanking: safetyFeatures.map(f => f.id),
      childEngagement: [],
      timeSpent: '',
      otherPlatforms: [],
      otherPlatformsOther: '',
      platformComparison: '',
      featurePriorities: featurePriorityOptions.map(f => f.id),
      signupLikelihood: '',
      recommendLikelihood: '',
      questionsAndConcerns: '',
      featureSuggestions: '',
      participationType: '',
      email: '',
      contactFrequency: '',
    },
  });

  const watchedValues = form.watch();
  const watchParticipation = form.watch('participationType');

  // Update form values when rankings change
  useEffect(() => {
    form.setValue('safetyFeatureRanking', safetyRanking);
  }, [safetyRanking, form]);

  useEffect(() => {
    form.setValue('featurePriorities', featureRanking);
  }, [featureRanking, form]);

  // Calculate completion percentage
  const calculateProgress = useCallback(() => {
    let completed = 0;
    const total = 10;

    if (watchedValues.childAgeGroup || watchedValues.heardFrom) completed++;
    if (watchedValues.overallSatisfaction > 0) completed++;
    if (watchedValues.expectedPrice) completed++;
    if (watchedValues.primaryValue?.length > 0) completed++;
    if (Object.values(watchedValues.concernRatings || {}).some(v => v !== 3)) completed++;
    if (watchedValues.childEngagement?.length > 0) completed++;
    if (watchedValues.otherPlatforms?.length > 0) completed++;
    if (watchedValues.signupLikelihood) completed++;
    if (watchedValues.questionsAndConcerns || watchedValues.featureSuggestions) completed++;
    if (watchedValues.participationType) completed++;

    return Math.round((completed / total) * 100);
  }, [watchedValues]);

  const progress = calculateProgress();

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const data = form.getValues();
      localStorage.setItem('parent-guardian-feedback-draft', JSON.stringify(data));
    }, 30000);

    return () => clearInterval(interval);
  }, [form]);

  // Load saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('parent-guardian-feedback-draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedTime = new Date(data.timestamp).getTime();
        const now = Date.now();
        if (now - savedTime < 24 * 60 * 60 * 1000) {
          form.reset(data);
          if (data.safetyFeatureRanking) setSafetyRanking(data.safetyFeatureRanking);
          if (data.featurePriorities) setFeatureRanking(data.featurePriorities);
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, [form]);

  const onSubmit = async (data: ParentFormData) => {
    setIsSubmitting(true);
    
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert feedback into database
      const { error } = await supabase
        .from('feedback_submissions')
        .insert({
          feedback_type: 'parent_guardian',
          session_id: data.sessionId,
          device_type: 'desktop', // Parent form typically from desktop
          language: data.language,
          user_id: user?.id || null,
          child_age_group: data.childAgeGroup || null,
          heard_from: data.heardFrom || null,
          overall_satisfaction: data.overallSatisfaction,
          first_impressions: data.firstImpressions,
          first_impressions_other: data.firstImpressionsOther || null,
          expected_price: data.expectedPrice,
          primary_value: data.primaryValue,
          primary_value_other: data.primaryValueOther || null,
          concern_ratings: data.concernRatings,
          safety_feature_ranking: data.safetyFeatureRanking,
          child_engagement: data.childEngagement,
          time_spent: data.timeSpent || null,
          other_platforms: data.otherPlatforms,
          other_platforms_other: data.otherPlatformsOther || null,
          platform_comparison: data.platformComparison || null,
          feature_priorities: data.featurePriorities,
          signup_likelihood: data.signupLikelihood,
          recommend_likelihood: data.recommendLikelihood || null,
          questions_and_concerns: data.questionsAndConcerns || null,
          feature_suggestions: data.featureSuggestions || null,
          participation_type: data.participationType || null,
          contact_email: data.email || null,
          contact_frequency: data.contactFrequency || null,
        });
      
      if (error) {
        console.error('Failed to submit feedback:', error);
        throw error;
      }
      
      // Send email notification with all details (fire and forget)
      supabase.functions.invoke('send-feedback-notification', {
        body: {
          feedbackType: 'parent_guardian',
          sessionId: data.sessionId,
          deviceType: 'desktop',
          language: data.language,
          childAgeGroup: data.childAgeGroup,
          heardFrom: data.heardFrom,
          firstImpressions: data.firstImpressions,
          firstImpressionsOther: data.firstImpressionsOther,
          expectedPrice: data.expectedPrice,
          primaryValue: data.primaryValue,
          primaryValueOther: data.primaryValueOther,
          overallSatisfaction: data.overallSatisfaction,
          concernRatings: data.concernRatings,
          safetyFeatureRanking: data.safetyFeatureRanking,
          childEngagement: data.childEngagement,
          otherPlatforms: data.otherPlatforms,
          otherPlatformsOther: data.otherPlatformsOther,
          platformComparison: data.platformComparison,
          featurePriorities: data.featurePriorities,
          featureSuggestions: data.featureSuggestions,
          signupLikelihood: data.signupLikelihood,
          recommendLikelihood: data.recommendLikelihood,
          questionsAndConcerns: data.questionsAndConcerns,
          contactEmail: data.email,
          contactFrequency: data.contactFrequency,
        }
      }).catch(err => console.error('Email notification failed:', err));
      
      localStorage.removeItem('parent-guardian-feedback-draft');
      setIsSubmitted(true);
      toast.success('Thank you for helping us create meaningful experiences for children!');
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ConcernScale = ({ 
    name, 
    label,
    icon: Icon
  }: { 
    name: keyof ParentFormData['concernRatings']; 
    label: string;
    icon: React.ElementType;
  }) => (
    <Controller
      control={form.control}
      name={`concernRatings.${name}`}
      render={({ field }) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm text-foreground">{label}</Label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16">No concern</span>
            <div className="flex-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => field.onChange(val)}
                  className={cn(
                    "flex-1 h-8 rounded text-xs font-medium transition-all",
                    field.value === val
                      ? val <= 2 ? "bg-accent/20 border border-accent text-accent"
                        : val === 3 ? "bg-muted border border-muted-foreground/30 text-muted-foreground"
                        : "bg-destructive/20 border border-destructive text-destructive"
                      : "bg-space-elevated/30 border border-border/30 text-muted-foreground hover:border-border"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground w-16 text-right">Very concerned</span>
          </div>
        </div>
      )}
    />
  );

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-accent/20 border-2 border-accent">
          <Heart className="w-12 h-12 text-accent animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          Thank You! 💚
        </h2>
        <p className="text-xl text-accent font-display mb-4">Your Insights Matter</p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Thank you for helping us create meaningful experiences for children. Your feedback directly shapes how we build safer, more valuable creative tools.
        </p>
        <SciFiButton variant="accent" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Feedback Center
        </SciFiButton>
      </motion.div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between mb-4">
        <SciFiButton type="button" variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </SciFiButton>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>~5-7 min</span>
        </div>
      </div>

      <div className="mb-6">
        <SciFiProgress value={progress} max={100} variant="accent" size="sm" showValue label="Completion" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          Parent Feedback: Help Us Create Valuable Experiences
        </h1>
        <p className="text-muted-foreground">Your insights shape safer, better experiences for young creators</p>
      </motion.div>

      {/* Section 1: Background Information */}
      <SciFiCard variant="default" headerLabel="BACKGROUND" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-space-elevated/50 border border-border/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Session ID</p>
              <p className="text-xs font-mono text-neon-cyan">{watchedValues.sessionId}</p>
            </div>
            <div className="p-3 bg-space-elevated/50 border border-border/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Timestamp</p>
              <p className="text-xs font-mono text-foreground">{new Date().toLocaleString()}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 bg-space-elevated/50 border border-border/30 rounded-lg">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-display text-foreground mb-2 block">Child&apos;s Age Group</Label>
              <Controller
                control={form.control}
                name="childAgeGroup"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-space-elevated border-border min-h-[48px]">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent className="bg-space-dark border-border z-50">
                      <SelectItem value="10-12">10-12 years old</SelectItem>
                      <SelectItem value="13-14">13-14 years old</SelectItem>
                      <SelectItem value="15-16">15-16 years old</SelectItem>
                      <SelectItem value="multiple">Multiple children</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="text-sm font-display text-foreground mb-2 block">How did you hear about us?</Label>
              <Controller
                control={form.control}
                name="heardFrom"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-space-elevated border-border min-h-[48px]">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-space-dark border-border z-50">
                      <SelectItem value="social">Social media</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="friend">Friend or family</SelectItem>
                      <SelectItem value="search">Search engine</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 2: Overall Impression */}
      <SciFiCard variant="default" headerLabel="OVERALL IMPRESSION" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-foreground mb-2 text-center">
            Based on what you&apos;ve seen or your child&apos;s experience
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">Overall Satisfaction *</p>
          
          <Controller
            control={form.control}
            name="overallSatisfaction"
            render={({ field }) => (
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="flex gap-2 sm:gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={cn(
                        "relative w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 transform",
                        (hoveredStar >= star || field.value >= star) && "scale-110"
                      )}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => field.onChange(star)}
                    >
                      <Star
                        className={cn(
                          "w-full h-full transition-all duration-300",
                          (hoveredStar >= star || field.value >= star)
                            ? "fill-accent text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between w-full max-w-xs text-[10px] text-muted-foreground">
                  <span>Very Dissatisfied</span>
                  <span>Very Satisfied</span>
                </div>
              </div>
            )}
          />
          {form.formState.errors.overallSatisfaction && (
            <p className="text-destructive text-sm text-center mb-4">Please rate your overall satisfaction</p>
          )}

          <Label className="text-sm font-display text-foreground mb-3 block">First Impression of Platform</Label>
          <Controller
            control={form.control}
            name="firstImpressions"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {firstImpressionOptions.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
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
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          <div className="mt-3">
            <Controller
              control={form.control}
              name="firstImpressionsOther"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Other impressions..."
                  className="bg-space-elevated border-border"
                />
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 3: Value Assessment */}
      <SciFiCard variant="default" headerLabel="VALUE ASSESSMENT" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-6">
          <div>
            <Label className="text-sm font-display text-foreground mb-3 block">
              What would you expect to pay monthly for this platform? *
            </Label>
            <Controller
              control={form.control}
              name="expectedPrice"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {priceOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-center justify-center p-3 rounded-lg border transition-all cursor-pointer text-center min-h-[48px]",
                        field.value === option.value
                          ? "bg-accent/10 border-accent/50"
                          : "bg-space-elevated/30 border-border/30 hover:border-accent/30"
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {form.formState.errors.expectedPrice && (
              <p className="text-destructive text-sm mt-2">Please select an expected price range</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-display text-foreground mb-1 block">
              What is the primary value you see? (Select up to 3)
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              {watchedValues.primaryValue?.length || 0}/3 selected
            </p>
            <Controller
              control={form.control}
              name="primaryValue"
              render={({ field }) => (
                <div className="grid grid-cols-1 gap-2">
                  {primaryValueOptions.map((option) => {
                    const isSelected = field.value.includes(option.id);
                    const isDisabled = !isSelected && field.value.length >= 3;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                          isSelected
                            ? "bg-accent/10 border-accent/50"
                            : "bg-space-elevated/30 border-border/30 hover:border-accent/30"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            if (isDisabled && checked) return;
                            const newValue = checked
                              ? [...field.value, option.id]
                              : field.value.filter((v) => v !== option.id);
                            field.onChange(newValue);
                          }}
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            <div className="mt-3">
              <Controller
                control={form.control}
                name="primaryValueOther"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Other value..."
                    className="bg-space-elevated border-border"
                  />
                )}
              />
            </div>
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 4: Safety & Appropriateness */}
      <SciFiCard variant="default" headerLabel="SAFETY & APPROPRIATENESS" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-lg font-display font-bold text-foreground mb-1 text-center">
              Please rate your level of concern
            </h3>
            <p className="text-xs text-muted-foreground text-center mb-4">1 = No concern, 5 = Very concerned</p>
            
            <div className="space-y-4">
              <ConcernScale name="contentAppropriateness" label="Content Appropriateness" icon={Eye} />
              <ConcernScale name="screenTime" label="Screen Time Management" icon={Timer} />
              <ConcernScale name="privacyProtection" label="Privacy Protection" icon={Lock} />
              <ConcernScale name="socialInteractions" label="Social Interactions" icon={UsersIcon} />
              <ConcernScale name="dataCollection" label="Data Collection" icon={Database} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-display text-foreground mb-1 block">
              What safety features are most important?
            </Label>
            <p className="text-xs text-muted-foreground mb-3">Drag to reorder (1 = most important)</p>
            
            <Reorder.Group values={safetyRanking} onReorder={setSafetyRanking} className="space-y-2">
              {safetyRanking.map((id, index) => {
                const feature = safetyFeatures.find(f => f.id === id)!;
                const Icon = feature.icon;
                return (
                  <Reorder.Item
                    key={id}
                    value={id}
                    className="flex items-center gap-3 p-3 bg-space-elevated/50 border border-border/30 rounded-lg cursor-grab active:cursor-grabbing"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-accent/20 text-accent text-xs font-bold rounded">
                      {index + 1}
                    </span>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{feature.label}</span>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 5: Child's Engagement */}
      <SciFiCard variant="default" headerLabel="CHILD'S ENGAGEMENT" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <Label className="text-sm font-display text-foreground mb-3 block">
              How did your child interact with the platform?
            </Label>
            <Controller
              control={form.control}
              name="childEngagement"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {engagementOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
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
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <Label className="text-sm font-display text-foreground mb-2 block">Estimated time child spent</Label>
            <Controller
              control={form.control}
              name="timeSpent"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-space-elevated border-border min-h-[48px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-dark border-border z-50">
                    <SelectItem value="under15">Less than 15 minutes</SelectItem>
                    <SelectItem value="15-30">15-30 minutes</SelectItem>
                    <SelectItem value="30-60">30-60 minutes</SelectItem>
                    <SelectItem value="1-2hours">1-2 hours</SelectItem>
                    <SelectItem value="over2hours">2+ hours</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 6: Competitive Comparison */}
      <SciFiCard variant="default" headerLabel="COMPETITIVE COMPARISON" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <Label className="text-sm font-display text-foreground mb-3 block">
              What other platforms does your child currently use?
            </Label>
            <Controller
              control={form.control}
              name="otherPlatforms"
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {competitorPlatforms.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer",
                        field.value.includes(option.id)
                          ? "bg-neon-cyan/10 border-neon-cyan/50"
                          : "bg-space-elevated/30 border-border/30 hover:border-neon-cyan/30"
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
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            <div className="mt-3">
              <Controller
                control={form.control}
                name="otherPlatformsOther"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Other platforms..."
                    className="bg-space-elevated border-border"
                  />
                )}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-display text-foreground mb-2 block">
              How does this compare to those platforms?
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Consider engagement, educational value, safety, cost...
            </p>
            <Controller
              control={form.control}
              name="platformComparison"
              render={({ field }) => (
                <div className="relative">
                  <Textarea
                    {...field}
                    placeholder="Share your comparison thoughts..."
                    className="min-h-[100px] bg-space-elevated border-border resize-none"
                    maxLength={500}
                  />
                  <p className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {field.value?.length || 0}/500
                  </p>
                </div>
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 7: Feature Priorities */}
      <SciFiCard variant="default" headerLabel="FEATURE PRIORITIES" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6">
          <Label className="text-sm font-display text-foreground mb-1 block">
            Rank importance to you
          </Label>
          <p className="text-xs text-muted-foreground mb-3">Drag to reorder (1 = most important)</p>
          
          <Reorder.Group values={featureRanking} onReorder={setFeatureRanking} className="space-y-2">
            {featureRanking.map((id, index) => {
              const feature = featurePriorityOptions.find(f => f.id === id)!;
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  className="flex items-center gap-3 p-3 bg-space-elevated/50 border border-border/30 rounded-lg cursor-grab active:cursor-grabbing"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-primary/20 text-primary text-xs font-bold rounded">
                    {index + 1}
                  </span>
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{feature.label}</span>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 8: Likelihood to Adopt */}
      <SciFiCard variant="default" headerLabel="LIKELIHOOD TO ADOPT" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-6">
          <div>
            <Label className="text-sm font-display text-foreground mb-3 block">
              How likely are you to sign up when available? *
            </Label>
            <Controller
              control={form.control}
              name="signupLikelihood"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {signupOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer min-h-[48px]",
                        field.value === option.value
                          ? "bg-accent/10 border-accent/50"
                          : "bg-space-elevated/30 border-border/30 hover:border-accent/30"
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        field.value === option.value ? "border-accent" : "border-muted-foreground/30"
                      )}>
                        {field.value === option.value && (
                          <span className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </span>
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {form.formState.errors.signupLikelihood && (
              <p className="text-destructive text-sm mt-2">Please select your signup likelihood</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-display text-foreground mb-3 block">
              Would you recommend to other parents?
            </Label>
            <Controller
              control={form.control}
              name="recommendLikelihood"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                  {recommendOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer min-h-[48px]",
                        field.value === option.value
                          ? "bg-primary/10 border-primary/50"
                          : "bg-space-elevated/30 border-border/30 hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        field.value === option.value ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {field.value === option.value && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 9: Open Feedback */}
      <SciFiCard variant="default" headerLabel="OPEN FEEDBACK" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <Label className="text-sm font-display text-foreground mb-2 block">
              What questions, concerns, or suggestions do you have?
            </Label>
            <Controller
              control={form.control}
              name="questionsAndConcerns"
              render={({ field }) => (
                <div className="relative">
                  <Textarea
                    {...field}
                    placeholder="Your insights help us create better experiences for children..."
                    className="min-h-[120px] bg-space-elevated border-border resize-none"
                    maxLength={1000}
                  />
                  <p className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {field.value?.length || 0}/1000
                  </p>
                </div>
              )}
            />
          </div>

          <div>
            <Label className="text-sm font-display text-foreground mb-2 block">
              Any specific features you&apos;d like to see added?
            </Label>
            <Controller
              control={form.control}
              name="featureSuggestions"
              render={({ field }) => (
                <div className="relative">
                  <Textarea
                    {...field}
                    placeholder="Tell us about features that would make this more valuable for your family..."
                    className="min-h-[100px] bg-space-elevated border-border resize-none"
                    maxLength={500}
                  />
                  <p className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {field.value?.length || 0}/500
                  </p>
                </div>
              )}
            />
          </div>
        </SciFiCardContent>
      </SciFiCard>

      {/* Section 10: Follow-Up & Beta Testing */}
      <SciFiCard variant="default" headerLabel="FOLLOW-UP & BETA TESTING" cornerAccents>
        <SciFiCardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <Label className="text-sm font-display text-foreground mb-3 block">
              Would you like to participate in future testing?
            </Label>
            <Controller
              control={form.control}
              name="participationType"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2">
                  {[
                    { value: 'updates', label: 'Yes, keep me updated on development' },
                    { value: 'beta', label: "Yes, I'd like to join beta testing" },
                    { value: 'no', label: 'No, just providing feedback' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        field.value === option.value
                          ? "bg-neon-cyan/10 border-neon-cyan/50"
                          : "bg-space-elevated/30 border-border/30 hover:border-neon-cyan/30"
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        field.value === option.value ? "border-neon-cyan" : "border-muted-foreground/30"
                      )}>
                        {field.value === option.value && (
                          <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                        )}
                      </span>
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

          <AnimatePresence>
            {(watchParticipation === 'updates' || watchParticipation === 'beta') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <Label className="text-sm font-display text-foreground mb-2 block">Email Address</Label>
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="your.email@example.com"
                        className="bg-space-elevated border-border"
                      />
                    )}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">Please enter a valid email address</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-display text-foreground mb-2 block">Preferred contact frequency</Label>
                  <Controller
                    control={form.control}
                    name="contactFrequency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-space-elevated border-border min-h-[48px]">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-space-dark border-border z-50">
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="major">Major updates only</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          variant="accent"
          className="w-full min-h-[60px] text-lg font-display"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Feedback
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

export default ParentGuardianForm;
