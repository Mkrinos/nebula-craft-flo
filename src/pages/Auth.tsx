import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import StarfieldBackground from '@/components/StarfieldBackground';
import NexusLogo from '@/components/NexusLogo';
import AnimatedPersonaAvatar from '@/components/AnimatedPersonaAvatar';
import WelcomeAvatar from '@/components/WelcomeAvatar';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiInput } from '@/components/ui/sci-fi-input';
import { useAuth } from '@/hooks/useAuth';
import { useUserPersona } from '@/hooks/useUserPersona';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, Home } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import mx2kLogo from '@/assets/mx2k-logo.png';
import logoAnimation from '@/assets/logo-animation.mp4';
import PasswordStrengthIndicator, { isPasswordStrong } from '@/components/PasswordStrengthIndicator';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

type AuthNavState = { mode?: 'signin' | 'signup' };

const Auth = () => {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { selectedPersona, loading: personaLoading } = useUserPersona();
  const { settings } = useMotionSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Performance-aware circuit count based on motion settings
  const circuitDensity = useMemo(() => {
    switch (settings.performanceMode) {
      case 'minimal': return 'minimal'; // Only 4 core circuits
      case 'reduced': return 'reduced'; // 12 circuits
      case 'full': return 'full'; // All circuits
      case 'auto':
      default:
        // Auto-detect based on device capabilities
        if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
          if (navigator.hardwareConcurrency <= 2) return 'minimal';
          if (navigator.hardwareConcurrency <= 4) return 'reduced';
        }
        return 'full';
    }
  }, [settings.performanceMode]);

  const resolveMode = () => {
    const stateMode = (location.state as AuthNavState | null)?.mode;
    const queryMode = searchParams.get('mode');
    return stateMode ?? (queryMode === 'signup' || queryMode === 'signin' ? queryMode : null);
  };

  const [isLogin, setIsLogin] = useState(() => resolveMode() !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Keep mode in sync when navigating to /auth with different parameters/state
  useEffect(() => {
    const mode = resolveMode();
    if (mode === 'signup') setIsLogin(false);
    if (mode === 'signin') setIsLogin(true);
  }, [(location.state as AuthNavState | null)?.mode, searchParams.get('mode')]);

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      toast.error('Please meet all password requirements for a secure account');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    setCheckingBreach(true);

    try {
      // Check if password has been breached
      const breachResult = await checkBreachedPassword(newPassword);
      setCheckingBreach(false);
      
      if (breachResult.breached) {
        toast.error(breachResult.message || 'This password has been exposed in a data breach. Please choose a different password.', {
          duration: 6000,
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setPasswordUpdated(true);
        toast.success('Password updated successfully!');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
      setCheckingBreach(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=signin`,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        setResetEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Only redirect logged-in users if not in recovery mode
  useEffect(() => {
    if (user && !isRecoveryMode) {
      navigate('/dashboard');
    }
  }, [user, navigate, isRecoveryMode]);

  // Check if password has been exposed in data breaches
  const checkBreachedPassword = async (pwd: string): Promise<{ breached: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-breached-password', {
        body: { password: pwd }
      });
      
      if (error) {
        console.error('Breach check error:', error);
        return { breached: false }; // Fail open
      }
      
      return { breached: data?.breached || false, message: data?.message };
    } catch (err) {
      console.error('Breach check failed:', err);
      return { breached: false }; // Fail open
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    // For signup, enforce strong password requirements
    if (!isLogin && !isPasswordStrong(password)) {
      toast.error('Please meet all password requirements for a secure account');
      return;
    }

    setLoading(true);

    try {
      // For signup, check if password has been breached
      if (!isLogin) {
        setCheckingBreach(true);
        const breachResult = await checkBreachedPassword(password);
        setCheckingBreach(false);
        
        if (breachResult.breached) {
          toast.error(breachResult.message || 'This password has been exposed in a data breach. Please choose a different password.', {
            duration: 6000,
          });
          setLoading(false);
          return;
        }
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back!');
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try logging in.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Account created successfully!');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
      setCheckingBreach(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <StarfieldBackground />
        <div className="w-12 h-12 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-safe pb-safe relative overflow-hidden">
      <StarfieldBackground />
      
      {/* Back to Home - Fixed Top Right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50"
      >
        <Link 
          to="/" 
          className="group flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-neon-cyan bg-background/30 backdrop-blur-sm border border-border/30 rounded-lg transition-all duration-300 touch-target hover:bg-background/50 hover:border-neon-cyan/30"
        >
          <Home className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
          <span>Home</span>
        </Link>
      </motion.div>
      
      {/* Ambient glow effects - reduced on mobile */}
      <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 rounded-full blur-[64px] sm:blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-80 h-40 sm:h-80 bg-neon-cyan/20 rounded-full blur-[50px] sm:blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* MX2K Branding - Top Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute -top-12 sm:-top-16 left-0 flex items-center gap-2"
        >
          <img 
            src={mx2kLogo} 
            alt="MX2K Logo" 
            className="h-6 sm:h-8 w-auto object-contain"
          />
          <span className="text-[10px] sm:text-xs font-display uppercase tracking-wider text-muted-foreground">
            Powered by <span className="text-neon-cyan">MX2K</span>
          </span>
        </motion.div>


        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-block">
            <NexusLogo size="lg" className="justify-center mb-4 sm:mb-6 scale-90 sm:scale-100" />
          </Link>
          
          {/* AI Welcome Avatar for new users */}
          {!selectedPersona?.avatar_url && (
            <WelcomeAvatar />
          )}
          
          {/* Animated Persona Avatar for returning users */}
          {isLogin && selectedPersona?.avatar_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-4 sm:mb-6"
            >
              <AnimatedPersonaAvatar
                avatarUrl={selectedPersona.avatar_url}
                personaName={selectedPersona.name}
                personaStyle={selectedPersona.style}
                size="xl"
                animate={true}
                showEntryAnimation={true}
              />
            </motion.div>
          )}
          
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            {isLogin ? (selectedPersona ? `Welcome Back` : 'Unleash Your Creative Journey') : 'Join the Journey'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {isLogin
              ? selectedPersona 
                ? `Continue as ${selectedPersona.name}` 
                : 'Enter your credentials to continue'
              : 'Create your account to start creating'}
          </p>
          
          {/* Brand Logo Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -8, 0]
            }}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.3 },
              scale: { duration: 0.8, delay: 0.3 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative flex justify-center mt-6 sm:mt-8"
          >
            {/* Sci-fi circuit lines expanding outward - performance optimized */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible will-change-transform"
              style={{ transform: 'scale(2.5)' }}
              aria-hidden="true"
            >
              <defs>
                {/* Subtle glow filters - GPU accelerated */}
                <filter id="cyanGlowSubtle" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="purpleGlowSubtle" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Circuit path 1 - top right main */}
              <motion.path
                d="M 128 128 L 166 90 L 205 90 L 218 64"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.8"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 0 }}
              />
              <motion.circle r="1.5" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], cx: [128, 166, 205, 218], cy: [128, 90, 90, 64] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
              />
              
              {/* Circuit path 2 - bottom left */}
              <motion.path
                d="M 128 128 L 90 166 L 51 166 L 38 192"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.8"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.45, 0.18] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
              />
              <motion.circle r="1.5" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 90, 51, 38], cy: [128, 166, 166, 192] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 1.7 }}
              />
              
              {/* Circuit path 3 - top left */}
              <motion.path
                d="M 128 128 L 102 77 L 64 72 L 51 38"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.6"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.4, 0.15] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 2 }}
              />
              <motion.circle r="1.2" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 102, 64, 51], cy: [128, 77, 72, 38] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 2.5 }}
              />
              
              {/* Circuit path 4 - bottom right */}
              <motion.path
                d="M 128 128 L 154 179 L 192 184 L 210 218"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.6"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.4, 0.15] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
              />
              <motion.circle r="1.2" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 154, 192, 210], cy: [128, 179, 184, 218] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.1 }}
              />
              
              {/* Right side circuits - faded cluster (reduced mode and above) */}
              {(circuitDensity === 'reduced' || circuitDensity === 'full') && (
                <>
              {/* Circuit 5 - right upper */}
              <motion.path
                d="M 128 128 L 170 115 L 210 120 L 248 108"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.35, 0.12] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 1.8 }}
              />
              <motion.circle r="1.5" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0], cx: [128, 170, 210, 248], cy: [128, 115, 120, 108] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 2.3 }}
              />
              
              {/* Circuit 6 - right middle */}
              <motion.path
                d="M 128 128 L 175 128 L 220 132 L 260 128"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.35, 0.12] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeOut", delay: 1 }}
              />
              <motion.circle r="1.5" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0], cx: [128, 175, 220, 260], cy: [128, 128, 132, 128] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: 1.5 }}
              />
              
              {/* Circuit 7 - right lower */}
              <motion.path
                d="M 128 128 L 168 145 L 210 155 L 250 170"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.32, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 2.5 }}
              />
              <motion.circle r="1.5" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0], cx: [128, 168, 210, 250], cy: [128, 145, 155, 170] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: "linear", delay: 3 }}
              />
              
              {/* Circuit 8 - far right upper */}
              <motion.path
                d="M 128 128 L 185 105 L 230 95 L 270 78"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.28, 0.08] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              />
              <motion.circle r="1.2" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], cx: [128, 185, 230, 270], cy: [128, 105, 95, 78] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 2 }}
              />
              
              {/* Circuit 9 - far right middle-upper */}
              <motion.path
                d="M 128 128 L 178 118 L 228 122 L 275 115"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.25, 0.08] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
              />
              <motion.circle r="1.2" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], cx: [128, 178, 228, 275], cy: [128, 118, 122, 115] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: "linear", delay: 0.8 }}
              />
              
              {/* Circuit 10 - far right middle-lower */}
              <motion.path
                d="M 128 128 L 175 140 L 225 145 L 272 142"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.25, 0.08] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: 2.2 }}
              />
              <motion.circle r="1.2" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], cx: [128, 175, 225, 272], cy: [128, 140, 145, 142] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: 2.7 }}
              />
              
              {/* Circuit 11 - far right lower */}
              <motion.path
                d="M 128 128 L 170 160 L 215 180 L 265 200"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.22, 0.07] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
              />
              <motion.circle r="1.2" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.65, 0.65, 0], cx: [128, 170, 215, 265], cy: [128, 160, 180, 200] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 1.3 }}
              />
                </>
              )}
              
              {/* Additional right side circuits - extended cluster (full mode only) */}
              {circuitDensity === 'full' && (
                <>
              {/* Circuit 15 - right upper-high */}
              <motion.path
                d="M 128 128 L 165 95 L 215 75 L 268 55"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.2, 0.06] }}
                transition={{ duration: 4.3, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
              <motion.circle r="1" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.65, 0.65, 0], cx: [128, 165, 215, 268], cy: [128, 95, 75, 55] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: 1 }}
              />
              
              {/* Circuit 16 - right horizontal high */}
              <motion.path
                d="M 128 128 L 182 100 L 240 98 L 295 92"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.18, 0.05] }}
                transition={{ duration: 4.7, repeat: Infinity, ease: "easeOut", delay: 2.8 }}
              />
              <motion.circle r="1" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 182, 240, 295], cy: [128, 100, 98, 92] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: 3.3 }}
              />
              
              {/* Circuit 17 - right branching mid */}
              <motion.path
                d="M 128 128 L 190 135 L 248 130 L 300 135"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.2, 0.05] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
              />
              <motion.circle r="0.9" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 190, 248, 300], cy: [128, 135, 130, 135] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "linear", delay: 1.7 }}
              />
              
              {/* Circuit 18 - right lower angle */}
              <motion.path
                d="M 128 128 L 175 155 L 235 168 L 290 178"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.18, 0.05] }}
                transition={{ duration: 4.9, repeat: Infinity, ease: "easeOut", delay: 3.5 }}
              />
              <motion.circle r="0.9" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], cx: [128, 175, 235, 290], cy: [128, 155, 168, 178] }}
                transition={{ duration: 2.7, repeat: Infinity, ease: "linear", delay: 4 }}
              />
              
              {/* Circuit 19 - right bottom steep */}
              <motion.path
                d="M 128 128 L 160 175 L 200 210 L 245 240"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.18, 0.05] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 2 }}
              />
              <motion.circle r="0.9" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], cx: [128, 160, 200, 245], cy: [128, 175, 210, 240] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 2.5 }}
              />
              
              {/* Circuit 20 - right top-high edge */}
              <motion.path
                d="M 128 128 L 155 80 L 195 52 L 240 28"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.25"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.15, 0.04] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              />
              <motion.circle r="0.8" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 155, 195, 240], cy: [128, 80, 52, 28] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 2 }}
              />
              
              {/* Extended right circuits - upper right cluster */}
              {/* Circuit 21R - far upper right */}
              <motion.path
                d="M 128 128 L 180 85 L 250 55 L 320 30"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.4, 0.15] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
              />
              <motion.circle r="1.3" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.75, 0.75, 0], cx: [128, 180, 250, 320], cy: [128, 85, 55, 30] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.7 }}
              />
              
              {/* Circuit 22R - upper right horizontal */}
              <motion.path
                d="M 128 128 L 195 95 L 280 85 L 360 78"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.45"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.35, 0.12] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              />
              <motion.circle r="1.2" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], cx: [128, 195, 280, 360], cy: [128, 95, 85, 78] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 2 }}
              />
              
              {/* Circuit 23R - middle right main */}
              <motion.path
                d="M 128 128 L 200 125 L 290 130 L 380 128"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.55"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.42, 0.15] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
              />
              <motion.circle r="1.4" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0], cx: [128, 200, 290, 380], cy: [128, 125, 130, 128] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: 1.3 }}
              />
              
              {/* Circuit 24R - middle right lower angle */}
              <motion.path
                d="M 128 128 L 190 145 L 275 160 L 355 172"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.38, 0.13] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: "easeOut", delay: 2.2 }}
              />
              <motion.circle r="1.3" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.75, 0.75, 0], cx: [128, 190, 275, 355], cy: [128, 145, 160, 172] }}
                transition={{ duration: 2.7, repeat: Infinity, ease: "linear", delay: 2.7 }}
              />
              
              {/* Circuit 25R - lower right steep */}
              <motion.path
                d="M 128 128 L 175 180 L 240 235 L 310 290"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.45"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.35, 0.1] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeOut", delay: 1 }}
              />
              <motion.circle r="1.2" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.7, 0], cx: [128, 175, 240, 310], cy: [128, 180, 235, 290] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "linear", delay: 1.5 }}
              />
              
              {/* Circuit 26R - lower right mid */}
              <motion.path
                d="M 128 128 L 185 165 L 260 195 L 340 225"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.32, 0.1] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 3 }}
              />
              <motion.circle r="1.1" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.65, 0.65, 0], cx: [128, 185, 260, 340], cy: [128, 165, 195, 225] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 3.5 }}
              />
              
              {/* Circuit 27R - upper right steep */}
              <motion.path
                d="M 128 128 L 165 75 L 220 30 L 280 -15"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.3, 0.08] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
              <motion.circle r="1" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 165, 220, 280], cy: [128, 75, 30, -15] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 1 }}
              />
              
              {/* Circuit 28R - far lower right */}
              <motion.path
                d="M 128 128 L 165 195 L 215 265 L 275 335"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.28, 0.08] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeOut", delay: 1.8 }}
              />
              <motion.circle r="0.9" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], cx: [128, 165, 215, 275], cy: [128, 195, 265, 335] }}
                transition={{ duration: 3.3, repeat: Infinity, ease: "linear", delay: 2.3 }}
              />
              
              {/* Additional dense right circuits */}
              {/* Circuit 29R - upper right branch */}
              <motion.path
                d="M 128 128 L 188 72 L 265 42 L 345 18"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.28, 0.08] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeOut", delay: 2.5 }}
              />
              <motion.circle r="0.9" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], cx: [128, 188, 265, 345], cy: [128, 72, 42, 18] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "linear", delay: 3 }}
              />
              
              {/* Circuit 30R - mid-upper right */}
              <motion.path
                d="M 128 128 L 205 108 L 295 102 L 390 98"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.25, 0.07] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
              />
              <motion.circle r="0.8" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 205, 295, 390], cy: [128, 108, 102, 98] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "linear", delay: 0.8 }}
              />
              
              {/* Circuit 31R - horizontal right */}
              <motion.path
                d="M 128 128 L 215 135 L 315 132 L 410 138"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.22, 0.06] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeOut", delay: 1.8 }}
              />
              <motion.circle r="0.8" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 215, 315, 410], cy: [128, 135, 132, 138] }}
                transition={{ duration: 3.3, repeat: Infinity, ease: "linear", delay: 2.3 }}
              />
              
              {/* Circuit 32R - lower right branch */}
              <motion.path
                d="M 128 128 L 195 178 L 280 218 L 365 258"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.22, 0.06] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: "easeOut", delay: 3.2 }}
              />
              <motion.circle r="0.8" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 195, 280, 365], cy: [128, 178, 218, 258] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "linear", delay: 3.7 }}
              />
              
              {/* Additional dense left circuits */}
              {/* Circuit 23L - far upper left */}
              <motion.path
                d="M 128 128 L 65 78 L -5 45 L -80 18"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.45"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.35, 0.12] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
              />
              <motion.circle r="1.1" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.65, 0.65, 0], cx: [128, 65, -5, -80], cy: [128, 78, 45, 18] }}
                transition={{ duration: 2.7, repeat: Infinity, ease: "linear", delay: 1.1 }}
              />
              
              {/* Circuit 24L - upper left branch */}
              <motion.path
                d="M 128 128 L 58 88 L -20 58 L -100 32"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.32, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 2.2 }}
              />
              <motion.circle r="1" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 58, -20, -100], cy: [128, 88, 58, 32] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 2.7 }}
              />
              
              {/* Circuit 25L - horizontal left */}
              <motion.path
                d="M 128 128 L 50 125 L -35 130 L -120 128"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.3, 0.1] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              />
              <motion.circle r="1" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], cx: [128, 50, -35, -120], cy: [128, 125, 130, 128] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "linear", delay: 2 }}
              />
              
              {/* Circuit 26L - lower left branch */}
              <motion.path
                d="M 128 128 L 62 172 L -10 210 L -85 248"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.28, 0.08] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 2.8 }}
              />
              <motion.circle r="0.9" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], cx: [128, 62, -10, -85], cy: [128, 172, 210, 248] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 3.3 }}
              />
              
              {/* Circuit 27L - far lower left */}
              <motion.path
                d="M 128 128 L 72 188 L 15 250 L -45 315"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.25, 0.07] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeOut", delay: 0.9 }}
              />
              <motion.circle r="0.8" fill="hsl(190 85% 65%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 72, 15, -45], cy: [128, 188, 250, 315] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 1.4 }}
              />
              
              {/* Circuit 28L - top left steep */}
              <motion.path
                d="M 128 128 L 82 58 L 35 -5 L -15 -70"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.22, 0.06] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeOut", delay: 3.5 }}
              />
              <motion.circle r="0.8" fill="hsl(275 65% 65%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.48, 0.48, 0], cx: [128, 82, 35, -15], cy: [128, 58, -5, -70] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "linear", delay: 4 }}
              />
                </>
              )}
              
              {/* Left side circuits - balanced (reduced mode and above) */}
              {(circuitDensity === 'reduced' || circuitDensity === 'full') && (
                <>
              {/* Circuit 12 - left */}
              <motion.path
                d="M 128 128 L 77 133 L 35 120 L -5 125"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.32, 0.1] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut", delay: 3 }}
              />
              <motion.circle r="1" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 77, 35, -5], cy: [128, 133, 120, 125] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: 3.5 }}
              />
              
              {/* Circuit 13 - left upper */}
              <motion.path
                d="M 128 128 L 85 105 L 40 92 L -5 80"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.28, 0.08] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 1.8 }}
              />
              <motion.circle r="0.8" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.4, 0], cx: [128, 85, 40, -5], cy: [128, 105, 92, 80] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 2.3 }}
              />
              
              {/* Circuit 14 - left lower */}
              <motion.path
                d="M 128 128 L 82 155 L 35 172 L -10 188"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.4"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.25, 0.08] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut", delay: 3.2 }}
              />
              <motion.circle r="0.8" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.35, 0.35, 0], cx: [128, 82, 35, -10], cy: [128, 155, 172, 188] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 3.7 }}
              />
                </>
              )}
              
              {/* Extended left side circuits - full spread (full mode only) */}
              {circuitDensity === 'full' && (
                <>
              {/* Circuit 15L - far left upper-high */}
              <motion.path
                d="M 128 128 L 75 90 L 25 65 L -25 45"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.5"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.35, 0.12] }}
                transition={{ duration: 4.3, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
              <motion.circle r="1" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], cx: [128, 75, 25, -25], cy: [128, 90, 65, 45] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: 1 }}
              />
              
              {/* Circuit 16L - far left horizontal */}
              <motion.path
                d="M 128 128 L 70 120 L 15 115 L -40 118"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.45"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.32, 0.1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
              />
              <motion.circle r="0.9" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0.45, 0], cx: [128, 70, 15, -40], cy: [128, 120, 115, 118] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: 1.7 }}
              />
              
              {/* Circuit 17L - left mid-upper angle */}
              <motion.path
                d="M 128 128 L 82 98 L 35 78 L -15 62"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.28, 0.08] }}
                transition={{ duration: 4.7, repeat: Infinity, ease: "easeOut", delay: 2.2 }}
              />
              <motion.circle r="0.7" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.4, 0], cx: [128, 82, 35, -15], cy: [128, 98, 78, 62] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 2.7 }}
              />
              
              {/* Circuit 18L - left mid-lower */}
              <motion.path
                d="M 128 128 L 78 142 L 25 148 L -30 152"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.35"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.25, 0.07] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
              />
              <motion.circle r="0.7" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.35, 0.35, 0], cx: [128, 78, 25, -30], cy: [128, 142, 148, 152] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 1.3 }}
              />
              
              {/* Circuit 19L - far left lower steep */}
              <motion.path
                d="M 128 128 L 88 165 L 45 195 L -5 225"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.22, 0.06] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeOut", delay: 2.8 }}
              />
              <motion.circle r="0.6" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0.3, 0], cx: [128, 88, 45, -5], cy: [128, 165, 195, 225] }}
                transition={{ duration: 2.9, repeat: Infinity, ease: "linear", delay: 3.3 }}
              />
              
              {/* Circuit 20L - far left top edge */}
              <motion.path
                d="M 128 128 L 95 72 L 55 35 L 10 5"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.3"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.2, 0.05] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
              />
              <motion.circle r="0.6" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.28, 0.28, 0], cx: [128, 95, 55, 10], cy: [128, 72, 35, 5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 2 }}
              />
              
              {/* Circuit 21L - left diagonal mid */}
              <motion.path
                d="M 128 128 L 65 128 L 10 125 L -45 130"
                stroke="hsl(275 65% 50%)"
                strokeWidth="0.25"
                fill="none"
                filter="url(#purpleGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.18, 0.05] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeOut", delay: 3.5 }}
              />
              <motion.circle r="0.5" fill="hsl(275 65% 60%)" filter="url(#purpleGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0.25, 0], cx: [128, 65, 10, -45], cy: [128, 128, 125, 130] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 4 }}
              />
              
              {/* Circuit 22L - left bottom-far */}
              <motion.path
                d="M 128 128 L 75 175 L 20 208 L -35 240"
                stroke="hsl(190 85% 50%)"
                strokeWidth="0.25"
                fill="none"
                filter="url(#cyanGlowSubtle)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.18, 0.04] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
              />
              <motion.circle r="0.5" fill="hsl(190 85% 60%)" filter="url(#cyanGlowSubtle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0.25, 0], cx: [128, 75, 20, -35], cy: [128, 175, 208, 240] }}
                transition={{ duration: 3.3, repeat: Infinity, ease: "linear", delay: 0.8 }}
              />
                </>
              )}
            </svg>
            
            {/* Performance mode debug indicator */}
            {settings.showPerformanceDashboard && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-primary/20 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  circuitDensity === 'full' ? 'bg-green-500 animate-pulse' :
                  circuitDensity === 'reduced' ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`} />
                <span className="text-muted-foreground">
                  {settings.performanceMode.toUpperCase()}
                </span>
                <span className="text-primary/70">
                  {circuitDensity === 'full' ? '40+' : circuitDensity === 'reduced' ? '12' : '4'} circuits
                </span>
              </div>
            )}
            
            {/* Sci-fi ripple rings - expanding outward */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ripple-${i}`}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 1.8, 2.2],
                  opacity: [0, 0.4, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 1.3
                }}
              >
                <div 
                  className="w-72 h-72 sm:w-96 sm:h-96 rounded-full"
                  style={{
                    border: '1px solid hsl(var(--neon-cyan) / 0.5)',
                    boxShadow: '0 0 20px hsl(var(--neon-cyan) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.2)'
                  }}
                />
              </motion.div>
            ))}
            
            {/* Animated glow rings */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-r from-primary/20 via-neon-cyan/20 to-primary/20 blur-xl" />
            </motion.div>
            
            {/* Secondary pulsing ring */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{ 
                scale: [1.1, 1.3, 1.1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-primary/30 blur-sm" />
            </motion.div>
            
            {/* Logo video container - circular mask to eliminate black edges */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {/* Deep purple ambient glow layer - slower, more intense breathing */}
              <motion.div 
                className="absolute -inset-10 z-0 rounded-full blur-3xl"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.15, 1]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: 'radial-gradient(circle, hsl(260 50% 35% / 0.8), hsl(250 45% 28% / 0.6), hsl(240 40% 22% / 0.4), transparent 70%)'
                }}
              />
              
              {/* Secondary glow for depth - offset breathing */}
              <motion.div 
                className="absolute -inset-6 z-0 rounded-full blur-2xl"
                animate={{
                  opacity: [0.4, 0.85, 0.4],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                style={{
                  background: 'radial-gradient(circle, hsl(270 55% 40% / 0.6), hsl(255 50% 32% / 0.5), transparent 60%)'
                }}
              />
              
              {/* Video with circular CSS mask - removes ALL black edges */}
              <video
                src={logoAnimation}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover relative z-[1]"
                style={{ 
                  filter: 'brightness(1.3) saturate(1.4) contrast(1.15)',
                  mixBlendMode: 'screen',
                  maskImage: 'radial-gradient(circle at center, white 0%, white 58%, transparent 72%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, white 0%, white 58%, transparent 72%)'
                }}
              />
              
              {/* Shimmer sweep effect */}
              <motion.div
                className="absolute inset-[10%] z-[5] pointer-events-none rounded-full overflow-hidden"
                style={{ opacity: 0.4 }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 4
                  }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, hsl(var(--neon-cyan) / 0.3), hsl(270 60% 70% / 0.2), transparent)',
                    width: '50%',
                    height: '100%'
                  }}
                />
              </motion.div>
              
              {/* Sparkle particles */}
              {[
                { top: '22%', left: '28%', delay: 0, size: 'w-1 h-1' },
                { top: '35%', right: '25%', delay: 1.5, size: 'w-1.5 h-1.5' },
                { top: '55%', left: '20%', delay: 0.8, size: 'w-1 h-1' },
                { top: '68%', right: '30%', delay: 2.2, size: 'w-1 h-1' },
                { top: '42%', left: '35%', delay: 3, size: 'w-0.5 h-0.5' },
                { top: '28%', right: '35%', delay: 1, size: 'w-0.5 h-0.5' },
              ].map((sparkle, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${sparkle.size} bg-white rounded-full z-[6] pointer-events-none`}
                  style={{ 
                    top: sparkle.top, 
                    left: sparkle.left, 
                    right: sparkle.right,
                    boxShadow: '0 0 4px 1px hsl(var(--neon-cyan) / 0.8)'
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: sparkle.delay
                  }}
                />
              ))}
              
              {/* Subtle outer glow ring */}
              <div 
                className="absolute inset-[15%] z-[2] pointer-events-none rounded-full"
                style={{
                  boxShadow: '0 0 40px 10px hsl(260 50% 40% / 0.3), 0 0 80px 20px hsl(250 45% 35% / 0.2), inset 0 0 30px hsl(270 40% 50% / 0.15)'
                }}
              />
              
              {/* Very subtle cyan accent */}
              <div 
                className="absolute inset-[18%] z-[3] pointer-events-none rounded-full opacity-20"
                style={{
                  border: '1px solid hsl(var(--neon-cyan) / 0.4)',
                  boxShadow: '0 0 15px hsl(var(--neon-cyan) / 0.2)'
                }}
              />
              
              {/* Orbiting particles */}
              <motion.div
                className="absolute inset-0 z-[4] pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              >
                <div 
                  className="absolute w-2 h-2 bg-neon-cyan rounded-full blur-[2px] opacity-80"
                  style={{ top: '5%', left: '50%', transform: 'translateX(-50%)' }}
                />
              </motion.div>
              
              <motion.div
                className="absolute inset-0 z-[4] pointer-events-none"
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                <div 
                  className="absolute w-1.5 h-1.5 bg-primary rounded-full blur-[1px] opacity-70"
                  style={{ bottom: '8%', left: '50%', transform: 'translateX(-50%)' }}
                />
              </motion.div>
              
              <motion.div
                className="absolute inset-0 z-[4] pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
              >
                <div 
                  className="absolute w-1 h-1 bg-neon-cyan rounded-full blur-[1px] opacity-60"
                  style={{ top: '50%', right: '3%', transform: 'translateY(-50%)' }}
                />
              </motion.div>
              
              <motion.div
                className="absolute inset-0 z-[4] pointer-events-none"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
              >
                <div 
                  className="absolute w-1.5 h-1.5 bg-primary/80 rounded-full blur-[2px] opacity-50"
                  style={{ top: '50%', left: '2%', transform: 'translateY(-50%)' }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Password Recovery Mode */}
        {isRecoveryMode ? (
          <SciFiFrame glowIntensity="medium" animated className="p-5 sm:p-8">
            {passwordUpdated ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neon-cyan/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-neon-cyan" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Password Updated!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been successfully updated. Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-foreground mb-2 text-center">
                  Set New Password
                </h2>
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  Enter your new password below
                </p>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <SciFiInput
                        type={showPassword ? 'text' : 'password'}
                        label="New Password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        icon={<Lock className="w-4 h-4" />}
                        required
                        className="text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[38px] text-muted-foreground hover:text-neon-cyan transition-colors p-1 touch-target"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>

                  <SciFiInput
                    type={showPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                    className="text-base"
                  />

                  <SciFiButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    shape="angled"
                    className="w-full group touch-target"
                    disabled={loading || checkingBreach}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        {checkingBreach && <span className="text-sm">Checking security...</span>}
                      </div>
                    ) : (
                      <>
                        Update Password
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </SciFiButton>
                </form>
              </>
            )}
          </SciFiFrame>
        ) : (
          <SciFiFrame glowIntensity="medium" animated className="p-5 sm:p-8">
            {/* Google OAuth Button */}
            <SciFiButton
              type="button"
              variant="ghost"
              size="lg"
              shape="angled"
              className="w-full group touch-target mb-4"
              onClick={async () => {
                const result = await lovable.auth.signInWithOAuth('google', {
                  redirect_uri: window.location.origin,
                });
                if (result?.error) {
                  toast.error(result.error.message || 'Google sign-in failed');
                }
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </SciFiButton>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neon-cyan/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <SciFiInput
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                className="text-base"
              />

              <div className="space-y-2">
                <div className="relative">
                  <SciFiInput
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                    className="text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-muted-foreground hover:text-neon-cyan transition-colors p-1 touch-target"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password strength indicator - only show during signup */}
                {!isLogin && (
                  <PasswordStrengthIndicator password={password} />
                )}

                {/* Forgot Password link - only show during login */}
                {isLogin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <SciFiButton
                type="submit"
                variant="primary"
                size="lg"
                shape="angled"
                className="w-full group touch-target"
                disabled={loading || checkingBreach}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {checkingBreach && <span className="text-sm">Checking security...</span>}
                  </div>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </SciFiButton>
            </form>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neon-cyan/20 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-neon-cyan hover:text-neon-cyan/80 font-display uppercase tracking-wider transition-colors touch-target"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </SciFiFrame>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowForgotPassword(false);
              setResetEmailSent(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SciFiFrame glowIntensity="medium" animated className="p-6 sm:p-8 max-w-sm w-full">
                <h2 className="font-display text-xl font-bold text-foreground mb-2 text-center">
                  Reset Password
                </h2>
                
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-neon-cyan/20 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-neon-cyan" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to <span className="text-neon-cyan">{email}</span>
                    </p>
                    <SciFiButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                      }}
                    >
                      Back to Login
                    </SciFiButton>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Enter your email and we'll send you a link to reset your password.
                    </p>
                    
                    <div className="space-y-4">
                      <SciFiInput
                        type="email"
                        label="Email Address"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail className="w-4 h-4" />}
                        required
                      />
                      
                      <div className="flex gap-2">
                        <SciFiButton
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmailSent(false);
                          }}
                        >
                          Cancel
                        </SciFiButton>
                        <SciFiButton
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={handleForgotPassword}
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            'Send Reset Link'
                          )}
                        </SciFiButton>
                      </div>
                    </div>
                  </>
                )}
              </SciFiFrame>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Auth;
