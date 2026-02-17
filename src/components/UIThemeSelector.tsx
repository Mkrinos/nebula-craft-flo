import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, RotateCcw, Lock, Coins } from 'lucide-react';
import { useUITheme, UITheme, uiThemeConfigs, isStarterTheme, themeCreditCosts } from '@/contexts/UIThemeContext';
import { SciFiPanel } from '@/components/ui/sci-fi-panel';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnlockedThemes } from '@/hooks/useUnlockedThemes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';

interface UIThemeSelectorProps {
  compact?: boolean;
  className?: string;
}

const themeLabels: Record<string, Record<UITheme, string>> = {
  en: {
    scifi: 'Sci-Fi',
    cyberpunk: 'Cyberpunk',
    abstract: 'Abstract',
    minimal: 'Minimal',
    darkmode: 'Dark Mode',
    vaporwave: 'Vaporwave',
    artdeco: 'Art Deco',
    nature: 'Nature',
    gaming: 'Gaming RGB',
  },
  es: {
    scifi: 'Ciencia Ficción',
    cyberpunk: 'Ciberpunk',
    abstract: 'Abstracto',
    minimal: 'Minimalista',
    darkmode: 'Modo Oscuro',
    vaporwave: 'Vaporwave',
    artdeco: 'Art Deco',
    nature: 'Naturaleza',
    gaming: 'Gaming RGB',
  },
  fr: {
    scifi: 'Sci-Fi',
    cyberpunk: 'Cyberpunk',
    abstract: 'Abstrait',
    minimal: 'Minimal',
    darkmode: 'Mode Sombre',
    vaporwave: 'Vaporwave',
    artdeco: 'Art Déco',
    nature: 'Nature',
    gaming: 'Gaming RGB',
  },
  de: {
    scifi: 'Sci-Fi',
    cyberpunk: 'Cyberpunk',
    abstract: 'Abstrakt',
    minimal: 'Minimal',
    darkmode: 'Dunkelmodus',
    vaporwave: 'Vaporwave',
    artdeco: 'Art Deco',
    nature: 'Natur',
    gaming: 'Gaming RGB',
  },
  ja: {
    scifi: 'SF',
    cyberpunk: 'サイバーパンク',
    abstract: 'アブストラクト',
    minimal: 'ミニマル',
    darkmode: 'ダークモード',
    vaporwave: 'ヴェイパーウェイブ',
    artdeco: 'アールデコ',
    nature: '自然',
    gaming: 'ゲーミングRGB',
  },
  ar: {
    scifi: 'خيال علمي',
    cyberpunk: 'سايبربانك',
    abstract: 'تجريدي',
    minimal: 'بسيط',
    darkmode: 'الوضع المظلم',
    vaporwave: 'فابورويف',
    artdeco: 'آرت ديكو',
    nature: 'طبيعة',
    gaming: 'ألعاب RGB',
  },
};

export function UIThemeSelector({ compact = false, className = '' }: UIThemeSelectorProps) {
  const { currentTheme, setTheme, isCustomOverride, resetToPersonaDefault, availableThemes } = useUITheme();
  const { currentLanguage: language } = useLanguage();
  const { isThemeUnlocked, isThemePurchasable, purchaseTheme, isPurchasing, getThemeCost } = useUnlockedThemes();

  const getThemeLabel = (themeId: UITheme): string => {
    return themeLabels[language]?.[themeId] || themeLabels.en[themeId];
  };

  const getThemeColor = (themeId: UITheme): string => {
    return uiThemeConfigs[themeId].colors.primary;
  };

  const getUnlockDescription = (themeId: UITheme): string | undefined => {
    const config = uiThemeConfigs[themeId];
    return config.unlockRequirement?.description;
  };

  const handleThemeClick = async (theme: typeof availableThemes[0]) => {
    const unlocked = isThemeUnlocked(theme.id);
    if (unlocked) {
      setTheme(theme.id);
    } else if (isThemePurchasable(theme.id)) {
      const success = await purchaseTheme(theme.id);
      if (success) {
        setTheme(theme.id);
      }
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TouchTriggerButton
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    aria-label="Select UI theme"
                  >
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <span
                      className="w-3 h-3 rounded-full border border-border pointer-events-none"
                      style={{ backgroundColor: getThemeColor(currentTheme) }}
                    />
                  </TouchTriggerButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            UI Theme
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableThemes.map((theme) => {
            const unlocked = isThemeUnlocked(theme.id);
            const purchasable = isThemePurchasable(theme.id);
            const cost = getThemeCost(theme.id);
            return (
              <TooltipProvider key={theme.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => handleThemeClick(theme)}
                      className={`flex items-center gap-2 cursor-pointer ${!unlocked && !purchasable ? 'opacity-50' : ''}`}
                      disabled={isPurchasing || (!unlocked && !purchasable)}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span className="flex-1">{getThemeLabel(theme.id)}</span>
                      {!unlocked && purchasable && cost ? (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          <Coins className="w-3 h-3 mr-1" />
                          {cost}
                        </Badge>
                      ) : !unlocked ? (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      ) : currentTheme === theme.id ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : null}
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  {!unlocked && (
                    <TooltipContent side="left">
                      <p className="text-xs">
                        {purchasable ? `Purchase for ${cost} credits` : getUnlockDescription(theme.id)}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {isCustomOverride && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={resetToPersonaDefault}
                className="flex items-center gap-2 cursor-pointer text-muted-foreground"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to persona default</span>
              </DropdownMenuItem>
            </>
          )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Customize visual theme and colors</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <SciFiPanel className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg text-foreground">UI Theme</h3>
        {isCustomOverride && (
          <span className="text-xs text-muted-foreground ml-auto">
            (Custom)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AnimatePresence mode="wait">
          {availableThemes.map((theme) => {
            const unlocked = isThemeUnlocked(theme.id);
            const purchasable = isThemePurchasable(theme.id);
            const cost = getThemeCost(theme.id);
            return (
              <TooltipProvider key={theme.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={unlocked || purchasable ? { scale: 1.02 } : undefined}
                      whileTap={unlocked || purchasable ? { scale: 0.98 } : undefined}
                      onPointerDown={(e) => {
                        if (e.pointerType === "touch" && (unlocked || purchasable)) {
                          e.preventDefault();
                          handleThemeClick(theme);
                        }
                      }}
                      onClick={(e) => {
                        if (e.detail === 0) return;
                        handleThemeClick(theme);
                      }}
                      disabled={isPurchasing || (!unlocked && !purchasable)}
                      className={`relative p-3 rounded-lg border transition-all text-left touch-manipulation min-h-[60px] ${
                        !unlocked && !purchasable
                          ? 'border-border/50 bg-secondary/10 opacity-60 cursor-not-allowed'
                          : !unlocked && purchasable
                          ? 'border-accent/50 bg-accent/5 hover:border-accent cursor-pointer'
                          : currentTheme === theme.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 bg-secondary/30'
                      }`}
                    >
                      {/* Color preview */}
                      <div className="flex gap-1 mb-2">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: theme.colors.background }}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-foreground">
                          {getThemeLabel(theme.id)}
                        </span>
                        {!unlocked && !purchasable && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {theme.description}
                      </div>

                      {/* Purchase badge */}
                      {!unlocked && purchasable && cost && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent-foreground border-accent/30">
                            <Coins className="w-3 h-3 mr-1" />
                            {cost}
                          </Badge>
                        </div>
                      )}

                      {currentTheme === theme.id && unlocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  {!unlocked && (
                    <TooltipContent>
                      <p className="text-xs">
                        {purchasable ? `Click to purchase for ${cost} credits` : getUnlockDescription(theme.id)}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </AnimatePresence>
      </div>

      {isCustomOverride && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-border"
        >
          <SciFiButton
            variant="ghost"
            size="sm"
            onClick={resetToPersonaDefault}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Persona Default
          </SciFiButton>
        </motion.div>
      )}
    </SciFiPanel>
  );
}
