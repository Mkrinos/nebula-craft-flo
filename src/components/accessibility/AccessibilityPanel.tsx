import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Zap, 
  Type, 
  Focus, 
  Volume2, 
  RotateCcw,
  Settings,
  Minus,
  Plus,
  Check
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAccessibilitySettingsSafe } from '@/hooks/useAccessibilitySettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';

export const AccessibilityPanel = () => {
  const { settings, updateSetting, resetSettings } = useAccessibilitySettingsSafe();

  const handleReset = () => {
    resetSettings();
    toast.success('Accessibility settings reset to defaults');
  };

  const fontSizeLabels: Record<number, string> = {
    0.75: 'Small',
    0.875: 'Medium-Small',
    1: 'Default',
    1.125: 'Medium-Large',
    1.25: 'Large',
    1.5: 'Extra Large',
    2: 'Maximum',
  };

  const currentFontLabel = fontSizeLabels[settings.fontSizeScale] || `${Math.round(settings.fontSizeScale * 100)}%`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <TouchTriggerButton
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative')}
          aria-label="Open accessibility settings"
        >
          <Settings className="h-4 w-4" />
          {(settings.highContrastEnabled || settings.reducedMotionEnabled) && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </TouchTriggerButton>
      </SheetTrigger>
      <SheetContent 
        className="w-[340px] sm:w-[400px] overflow-y-auto"
        aria-describedby="accessibility-description"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Accessibility Settings
          </SheetTitle>
          <SheetDescription id="accessibility-description">
            Customize your experience for better accessibility
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Visual Settings */}
          <section aria-labelledby="visual-settings">
            <h3 id="visual-settings" className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual
            </h3>
            
            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast" className="text-sm font-medium">
                    High Contrast Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Increase color contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrastEnabled}
                  onCheckedChange={(checked) => updateSetting('highContrastEnabled', checked)}
                  aria-describedby="high-contrast-desc"
                />
              </div>

              {/* Enhanced Focus Indicators */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enhanced-focus" className="text-sm font-medium">
                    Enhanced Focus Indicators
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Larger, more visible focus outlines
                  </p>
                </div>
                <Switch
                  id="enhanced-focus"
                  checked={settings.focusIndicatorsEnhanced}
                  onCheckedChange={(checked) => updateSetting('focusIndicatorsEnhanced', checked)}
                />
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="font-size" className="text-sm font-medium">
                    Text Size
                  </Label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {currentFontLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateSetting('fontSizeScale', Math.max(0.75, settings.fontSizeScale - 0.125))}
                    disabled={settings.fontSizeScale <= 0.75}
                    aria-label="Decrease text size"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Slider
                    id="font-size"
                    min={0.75}
                    max={2}
                    step={0.125}
                    value={[settings.fontSizeScale]}
                    onValueChange={([value]) => updateSetting('fontSizeScale', value)}
                    className="flex-1"
                    aria-label="Text size slider"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateSetting('fontSizeScale', Math.min(2, settings.fontSizeScale + 0.125))}
                    disabled={settings.fontSizeScale >= 2}
                    aria-label="Increase text size"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Motion Settings */}
          <section aria-labelledby="motion-settings">
            <h3 id="motion-settings" className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Motion & Animation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion" className="text-sm font-medium">
                    Reduce Motion
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.reducedMotionEnabled}
                  onCheckedChange={(checked) => updateSetting('reducedMotionEnabled', checked)}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Screen Reader */}
          <section aria-labelledby="sr-settings">
            <h3 id="sr-settings" className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Screen Reader
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sr-optimized" className="text-sm font-medium">
                    Screen Reader Optimized
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enhanced announcements and descriptions
                  </p>
                </div>
                <Switch
                  id="sr-optimized"
                  checked={settings.screenReaderOptimized}
                  onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audio-desc" className="text-sm font-medium">
                    Audio Descriptions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Describe images and visual content
                  </p>
                </div>
                <Switch
                  id="audio-desc"
                  checked={settings.audioDescriptionsEnabled}
                  onCheckedChange={(checked) => updateSetting('audioDescriptionsEnabled', checked)}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Keyboard Navigation */}
          <section aria-labelledby="keyboard-settings">
            <h3 id="keyboard-settings" className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Focus className="h-4 w-4" />
              Keyboard Navigation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enhanced-keyboard" className="text-sm font-medium">
                    Enhanced Keyboard Navigation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Improved Tab key behavior and shortcuts
                  </p>
                </div>
                <Switch
                  id="enhanced-keyboard"
                  checked={settings.keyboardNavigationEnhanced}
                  onCheckedChange={(checked) => updateSetting('keyboardNavigationEnhanced', checked)}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Reset Button */}
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-xs">
            <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li><kbd className="px-1 bg-background rounded">Tab</kbd> - Navigate between elements</li>
              <li><kbd className="px-1 bg-background rounded">Shift+Escape</kbd> - Return to main content</li>
              <li><kbd className="px-1 bg-background rounded">Ctrl/Cmd+K</kbd> - Open command palette</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AccessibilityPanel;
