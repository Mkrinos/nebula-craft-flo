import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SwipeablePageWrapper } from '@/components/SwipeablePageWrapper';
import StarfieldBackground from '@/components/StarfieldBackground';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiCard, SciFiCardContent, SciFiCardFooter } from '@/components/ui/sci-fi-card';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiProgress } from '@/components/ui/sci-fi-progress';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { SciFiDivider } from '@/components/ui/sci-fi-divider';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Zap, 
  Check, 
  Crown, 
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  Star,
  Loader2,
  Settings
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';

const PACKAGE_IDS = {
  'Starter Universe': 'starter_universe',
  'Stellar': 'stellar',
  'Cosmic': 'cosmic',
  'Galactic': 'galactic',
} as const;

const Billing = () => {
  const { user } = useAuth();
  const { subscription, isLoading: subLoading, refetch, getTierDisplayName, getTierIcon } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const packageName = searchParams.get('package');
    const credits = searchParams.get('credits');

    if (success === 'true') {
      toast.success(`Payment successful! ${credits === '-1' ? 'Unlimited' : credits} credits added.`);
      refetch();
      // Clear the URL params
      setSearchParams({});
    } else if (canceled === 'true') {
      toast.info('Payment was canceled.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetch]);

  const handlePurchase = async (planName: string) => {
    if (!user) {
      toast.error('Please sign in to purchase a plan');
      return;
    }

    const packageId = PACKAGE_IDS[planName as keyof typeof PACKAGE_IDS];
    if (!packageId) {
      toast.error('Invalid plan selected');
      return;
    }

    setPurchasingPlan(planName);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { packageId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setPurchasingPlan(null);
    }
  };

  const handleManagePlan = async () => {
    if (!user) {
      toast.error('Please sign in to manage your plan');
      return;
    }

    setOpeningPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (!data?.url) throw new Error('No portal URL received');

      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Customer portal error:', error);
      toast.error(error.message || 'Failed to open customer portal. Please try again.');
    } finally {
      setOpeningPortal(false);
    }
  };

  const plans = [
    {
      name: 'Starter Universe',
      price: 9,
      credits: 100,
      icon: Star,
      features: [
        '100 interaction credits',
        'Basic space themes',
        'Standard controls',
        'Community access',
      ],
      popular: false,
    },
    {
      name: 'Stellar',
      price: 19,
      credits: 500,
      icon: Sparkles,
      features: [
        '500 interaction credits',
        'Basic sci-fi themes',
        'Standard gesture controls',
        'Community features',
      ],
      popular: false,
    },
    {
      name: 'Cosmic',
      price: 39,
      credits: 'Unlimited',
      icon: Crown,
      features: [
        'Unlimited interactions',
        'Advanced 3D environments',
        'Custom avatar creation',
        'Premium gesture sets',
        'Export capabilities',
      ],
      popular: true,
    },
    {
      name: 'Galactic',
      price: 79,
      credits: 'Unlimited+',
      icon: Zap,
      features: [
        'Everything in Cosmic',
        'Collaborative spaces',
        'Custom world building',
        'Advanced AI interactions',
        'Priority feature access',
      ],
      popular: false,
    },
  ];

  const creditPacks = [
    { credits: 25, price: 5, bonus: 0 },
    { credits: 100, price: 15, bonus: 15 },
    { credits: 500, price: 50, bonus: 100 },
  ];

  const usageHistory = [
    { date: 'Today', action: 'Image Generation', credits: -1 },
    { date: 'Today', action: 'Image Generation', credits: -1 },
    { date: 'Yesterday', action: 'Credit Purchase', credits: 100 },
    { date: '3 days ago', action: 'Image Generation', credits: -1 },
  ];

  const currentTier = subscription?.tier || 'starter_universe';
  const creditsRemaining = subscription?.credits_remaining ?? 0;
  const creditsLimit = subscription?.credits_limit ?? 100;
  const isUnlimited = creditsRemaining === -1;

  return (
    <SwipeablePageWrapper>
      <div className="min-h-screen relative">
        <StarfieldBackground />
        <Navigation />
      <main className="relative z-10 pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 pb-safe">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BackButton />
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                <span className="text-gradient">Billing & Credits</span>
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg ml-11">
              Manage your subscription and purchase credits
            </p>
          </div>

          {/* Current Plan - Sci-Fi Panel */}
          <SciFiPanel 
            title="CURRENT SUBSCRIPTION" 
            subtitle="Active membership"
            status="active"
            variant="floating"
            className="mb-6 sm:mb-8"
            headerRight={<SciFiBadge variant="success" className="text-xs">ACTIVE</SciFiBadge>}
          >
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <SciFiFrame 
                  size="sm" 
                  glowIntensity="medium" 
                  className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0"
                >
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-neon-cyan" />
                </SciFiFrame>
                <div className="min-w-0">
                  <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">
                    {getTierIcon(currentTier)} {getTierDisplayName(currentTier)}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {subscription?.reset_at 
                      ? `Resets ${new Date(subscription.reset_at).toLocaleDateString()}`
                      : 'Monthly subscription'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-neon-cyan/20">
                <div className="text-left xs:text-right">
                  <p className="text-2xl sm:text-4xl font-display font-bold text-neon-cyan">
                    {isUnlimited ? '∞' : creditsRemaining}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isUnlimited ? 'Unlimited credits' : `of ${creditsLimit} credits remaining`}
                  </p>
                </div>
                <SciFiButton 
                  variant="default" 
                  shape="angled" 
                  className="w-full xs:w-auto touch-target"
                  onClick={handleManagePlan}
                  disabled={openingPortal}
                >
                  {openingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Plan
                    </>
                  )}
                </SciFiButton>
              </div>
            </div>
          </SciFiPanel>

          <SciFiDivider variant="decorated" className="mb-6 sm:mb-8" />

          {/* Plans Grid */}
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="w-1.5 sm:w-2 h-5 sm:h-6 bg-neon-cyan" />
            Subscription Plans
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {plans.map((plan) => {
              const planPackageId = PACKAGE_IDS[plan.name as keyof typeof PACKAGE_IDS];
              const isCurrentPlan = currentTier === planPackageId;
              const isPurchasing = purchasingPlan === plan.name;

              return (
                <SciFiCard 
                  key={plan.name} 
                  variant={plan.popular ? 'elevated' : 'default'}
                  animated
                  className="flex flex-col"
                >
                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
                  )}
                  
                  <SciFiCardContent className="flex-1 p-4 sm:p-6">
                    {plan.popular && (
                      <SciFiBadge variant="accent" className="mb-3 sm:mb-4 text-xs">Most Popular</SciFiBadge>
                    )}
                    
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 mb-3 sm:mb-4 border-2 border-neon-cyan/40 bg-neon-cyan/10">
                        <plan.icon className="w-5 h-5 sm:w-7 sm:h-7 text-neon-cyan" />
                      </div>
                      <h3 className="font-display text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl sm:text-4xl font-display font-bold text-foreground">${plan.price}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">/month</span>
                      </div>
                      <p className="text-xs sm:text-sm text-neon-cyan mt-1 sm:mt-2 flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                        {typeof plan.credits === 'number' ? `${plan.credits} credits/month` : plan.credits}
                      </p>
                    </div>

                    <ul className="space-y-2 sm:space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </SciFiCardContent>

                  <SciFiCardFooter className="justify-center p-4 sm:p-6 pt-0">
                    <SciFiButton 
                      variant={isCurrentPlan ? 'default' : plan.popular ? 'primary' : 'accent'} 
                      shape="angled"
                      className="w-full touch-target"
                      disabled={isCurrentPlan || isPurchasing || !user}
                      onClick={() => handlePurchase(plan.name)}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        'Purchase'
                      )}
                    </SciFiButton>
                  </SciFiCardFooter>
                </SciFiCard>
              );
            })}
          </div>

          {/* Credit Packs */}
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="w-1.5 sm:w-2 h-5 sm:h-6 bg-primary" />
            Buy More Credits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {creditPacks.map((pack) => (
              <SciFiFrame 
                key={pack.credits} 
                animated 
                glowIntensity="subtle"
                className="p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-neon-cyan/50 bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base sm:text-xl font-bold text-foreground">{pack.credits} Credits</p>
                      {pack.bonus > 0 && (
                        <SciFiBadge variant="success" size="sm" className="text-xs">+{pack.bonus} bonus!</SciFiBadge>
                      )}
                    </div>
                  </div>
                  <p className="text-xl sm:text-3xl font-display font-bold text-neon-cyan flex-shrink-0">${pack.price}</p>
                </div>
                <SciFiButton variant="accent" shape="angled" className="w-full gap-2 touch-target">
                  Purchase
                  <ArrowRight className="w-4 h-4" />
                </SciFiButton>
              </SciFiFrame>
            ))}
          </div>

          {/* Usage History & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <SciFiPanel 
              title="RECENT ACTIVITY" 
              status="default"
              headerRight={<Clock className="w-4 h-4 text-neon-cyan" />}
            >
              <div className="space-y-2 sm:space-y-3">
                {usageHistory.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 sm:p-3 gap-2 border border-neon-cyan/20 bg-space-dark/50"
                    style={{
                      clipPath: "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))"
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{item.action}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <SciFiBadge 
                      variant={item.credits > 0 ? 'success' : 'outline'} 
                      size="sm"
                      className="flex-shrink-0 text-xs"
                    >
                      {item.credits > 0 ? '+' : ''}{item.credits}
                    </SciFiBadge>
                  </div>
                ))}
              </div>
            </SciFiPanel>

            <SciFiPanel 
              title="USAGE STATISTICS" 
              status="active"
              headerRight={<TrendingUp className="w-4 h-4 text-neon-cyan" />}
            >
              <div className="space-y-4 sm:space-y-6">
                <SciFiProgress 
                  value={subscription?.credits_used ?? 0} 
                  max={creditsLimit} 
                  variant="gradient"
                  size="md"
                  label="Credits Used This Month"
                  showValue
                />
                
                <SciFiProgress 
                  value={isUnlimited ? 100 : Math.round((creditsRemaining / creditsLimit) * 100)} 
                  max={100} 
                  variant="segmented"
                  size="lg"
                  label="Monthly Quota"
                />

                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <SciFiFrame size="sm" glowIntensity="subtle" className="text-center py-3 sm:py-4">
                    <p className="text-xl sm:text-3xl font-display font-bold text-neon-cyan">
                      {subscription?.credits_used ?? 0}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Credits Used</p>
                  </SciFiFrame>
                  <SciFiFrame size="sm" glowIntensity="subtle" className="text-center py-3 sm:py-4">
                    <p className="text-xl sm:text-3xl font-display font-bold text-primary">
                      {isUnlimited ? '∞' : creditsRemaining}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Credits Left</p>
                  </SciFiFrame>
                </div>
              </div>
            </SciFiPanel>
          </div>
        </div>
      </main>
      
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SwipeablePageWrapper>
  );
};

export default Billing;
