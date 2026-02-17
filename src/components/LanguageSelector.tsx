import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage, supportedLanguages, LanguageCode } from '@/contexts/LanguageContext';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { Globe, Check, ChevronDown, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSelector({ compact = false, className }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, getLanguageInfo, autoDetect, setAutoDetect, voiceInputEnabled, setVoiceInputEnabled } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLangInfo = getLanguageInfo(currentLanguage);
  const languageCodes = Object.keys(supportedLanguages) as LanguageCode[];

  const handleLanguageChange = useCallback((code: LanguageCode) => {
    if (code !== currentLanguage) {
      const newLangInfo = supportedLanguages[code];
      setLanguage(code);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4" />
          <div>
            <p className="font-medium">Language switched to {newLangInfo.nativeName}</p>
            <p className="text-xs text-muted-foreground">
              Prompts and voice input will use {newLangInfo.name}
            </p>
          </div>
        </div>,
        { duration: 3000 }
      );
    }
  }, [currentLanguage, setLanguage]);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <TouchTriggerButton
                    aria-label="Select language"
                    className={cn(
                      "relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-95 [&_svg]:pointer-events-none",
                      "h-11 w-11 min-h-[44px] min-w-[44px] border-2 border-transparent text-foreground hover:border-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/10",
                      className
                    )}
                  >
                    <Globe className="w-4 h-4" />
                  </TouchTriggerButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-space-elevated border-neon-cyan/30"
                >
                  {languageCodes.map((code) => {
                    const info = supportedLanguages[code];
                    return (
                      <DropdownMenuItem
                        key={code}
                        onClick={() => handleLanguageChange(code)}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          currentLanguage === code && 'bg-neon-cyan/10'
                        )}
                      >
                        <span className="text-lg">{info.flag}</span>
                        <span className="flex-1">{info.nativeName}</span>
                        {currentLanguage === code && <Check className="w-4 h-4 text-neon-cyan" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Select interface and prompt language</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <SciFiFrame size="sm" glowIntensity="subtle" className={cn('p-4', className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Language Settings
          </h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center justify-between gap-3 p-3 border border-neon-cyan/30 bg-space-dark/50 hover:bg-neon-cyan/10 transition-colors"
              style={{
                clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{currentLangInfo.flag}</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{currentLangInfo.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{currentLangInfo.name}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-space-elevated border-neon-cyan/30 max-h-64 overflow-y-auto">
            {languageCodes.map((code) => {
              const info = supportedLanguages[code];
              return (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer',
                    currentLanguage === code && 'bg-neon-cyan/10'
                  )}
                >
                  <span className="text-lg">{info.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm">{info.nativeName}</p>
                    <p className="text-xs text-muted-foreground">{info.name}</p>
                  </div>
                  {currentLanguage === code && <Check className="w-4 h-4 text-neon-cyan" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auto-detect toggle */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div 
            className={cn(
              'w-5 h-5 border-2 flex items-center justify-center transition-all',
              autoDetect ? 'border-neon-cyan bg-neon-cyan/20' : 'border-neon-cyan/40'
            )}
          >
            {autoDetect && <div className="w-2 h-2 bg-neon-cyan" />}
          </div>
          <input
            type="checkbox"
            checked={autoDetect}
            onChange={(e) => setAutoDetect(e.target.checked)}
            className="sr-only"
          />
          <span className="text-sm text-foreground group-hover:text-neon-cyan transition-colors">
            Auto-detect language from prompts
          </span>
        </label>

        {/* Voice input toggle */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div 
            className={cn(
              'w-5 h-5 border-2 flex items-center justify-center transition-all',
              voiceInputEnabled ? 'border-neon-cyan bg-neon-cyan/20' : 'border-neon-cyan/40'
            )}
          >
            {voiceInputEnabled && <div className="w-2 h-2 bg-neon-cyan" />}
          </div>
          <input
            type="checkbox"
            checked={voiceInputEnabled}
            onChange={(e) => setVoiceInputEnabled(e.target.checked)}
            className="sr-only"
          />
          <span className="text-sm text-foreground group-hover:text-neon-cyan transition-colors">
            Enable voice input
          </span>
        </label>
      </div>
    </SciFiFrame>
  );
}

