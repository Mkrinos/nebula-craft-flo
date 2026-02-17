import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { PersonaThemeProvider } from "@/contexts/PersonaThemeContext";
import { MotionSettingsProvider } from "@/contexts/MotionSettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { GlobalPersonaProvider } from "@/contexts/GlobalPersonaContext";
import { UIThemeProvider } from "@/contexts/UIThemeContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { PersonaUIThemeBridge } from "@/components/PersonaUIThemeBridge";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalAchievementCelebration } from "@/components/GlobalAchievementCelebration";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { DevOnboardingReset } from "@/components/DevOnboardingReset";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MiniPlayerBar } from "@/components/MiniPlayerBar";
import { AccessibilityProvider } from "@/hooks/useAccessibilitySettings";
import { SkipNavigation, FocusManager } from "@/components/accessibility";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { TouchDiagnostics } from "@/components/TouchDiagnostics";
import { QuickActionsBar } from "@/components/QuickActionsBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SciFiFrame } from "@/components/ui/sci-fi-frame";
import { SciFiButton } from "@/components/ui/sci-fi-button";
import { AdaptivePerformanceProvider } from "@/components/AdaptivePerformanceProvider";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccessibilityProvider>
          <MotionSettingsProvider>
            <DeviceProvider>
              <LanguageProvider>
                <PersonaThemeProvider>
                  <UIThemeProvider>
                    <GlobalPersonaProvider>
                      <MusicProvider>
                        <AdaptivePerformanceProvider>
                          <PersonaUIThemeBridge />
                          <TooltipProvider>
                            <Toaster />
                            <Sonner />
                            <BrowserRouter>
                              <SkipNavigation />
                              <FocusManager>
                                <OfflineIndicator />
                                <CommandPalette />
                                <GlobalAchievementCelebration />
                                <OnboardingWizard />
                                <DevOnboardingReset />

                                <ErrorBoundary
                                  fallback={(error) => (
                                    <div className="min-h-screen flex items-center justify-center p-4">
                                      <SciFiFrame glowIntensity="medium" animated className="p-6 max-w-md w-full">
                                        <div className="space-y-3">
                                          <h1 className="font-display text-xl font-bold text-foreground">
                                            Something went wrong
                                          </h1>
                                          <p className="text-sm text-muted-foreground">
                                            The app hit an unexpected error and couldnt render this screen.
                                          </p>
                                          <details className="text-xs text-muted-foreground/80">
                                            <summary className="cursor-pointer">Technical details</summary>
                                            <pre className="mt-2 whitespace-pre-wrap break-words">
                                              {String((error as any)?.message ?? error)}
                                            </pre>
                                          </details>
                                          <div className="flex gap-2 pt-2">
                                            <SciFiButton
                                              type="button"
                                              variant="primary"
                                              shape="angled"
                                              className="flex-1"
                                              onClick={() => window.location.reload()}
                                            >
                                              Reload
                                            </SciFiButton>
                                            <SciFiButton
                                              type="button"
                                              variant="ghost"
                                              shape="angled"
                                              className="flex-1"
                                              onClick={() => (window.location.href = "/auth")}
                                            >
                                              Back to Login
                                            </SciFiButton>
                                          </div>
                                        </div>
                                      </SciFiFrame>
                                    </div>
                                  )}
                                >
                                  <AnimatedRoutes />
                                </ErrorBoundary>

                                {/* Global Music Player - persists across all page navigations */}
                                <MusicPlayer />
                                {/* Mini player bar - shows current track at bottom */}
                                <MiniPlayerBar />
                                {/* Quick Actions FAB */}
                                <QuickActionsBar />
                                {/* Touch Diagnostics - dev only */}
                                <TouchDiagnostics />
                              </FocusManager>
                            </BrowserRouter>
                          </TooltipProvider>
                        </AdaptivePerformanceProvider>
                      </MusicProvider>
                    </GlobalPersonaProvider>
                  </UIThemeProvider>
                </PersonaThemeProvider>
              </LanguageProvider>
            </DeviceProvider>
          </MotionSettingsProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
