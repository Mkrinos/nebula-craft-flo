import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const { strength, passedCount, results } = useMemo(() => {
    const results = requirements.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
    const passedCount = results.filter((r) => r.passed).length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (passedCount >= 5) strength = 'strong';
    else if (passedCount >= 4) strength = 'good';
    else if (passedCount >= 2) strength = 'fair';
    
    return { strength, passedCount, results };
  }, [password]);

  const strengthConfig = {
    weak: { color: 'bg-destructive', text: 'Weak', textColor: 'text-destructive' },
    fair: { color: 'bg-yellow-500', text: 'Fair', textColor: 'text-yellow-500' },
    good: { color: 'bg-neon-cyan', text: 'Good', textColor: 'text-neon-cyan' },
    strong: { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-500' },
  };

  const config = strengthConfig[strength];

  if (!password) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn('space-y-3', className)}
      >
        {/* Strength bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Password strength</span>
            <span className={cn('text-xs font-medium', config.textColor)}>{config.text}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden flex gap-1">
            {[1, 2, 3, 4, 5].map((segment) => (
              <motion.div
                key={segment}
                className={cn(
                  'h-full flex-1 rounded-full transition-colors duration-300',
                  segment <= passedCount ? config.color : 'bg-muted-foreground/20'
                )}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: segment * 0.05 }}
              />
            ))}
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="grid grid-cols-1 gap-1.5">
          {results.map((req, index) => (
            <motion.div
              key={req.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-200',
                req.passed ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {req.passed ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const isPasswordStrong = (password: string): boolean => {
  return requirements.every((req) => req.test(password));
};

export default PasswordStrengthIndicator;
