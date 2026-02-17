import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import StarfieldBackground from "@/components/StarfieldBackground";
import { SciFiFrame } from "@/components/ui/sci-fi-frame";
import { SciFiButton } from "@/components/ui/sci-fi-button";
import NexusLogo from "@/components/NexusLogo";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <StarfieldBackground />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-destructive/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 text-center max-w-lg">
        <Link to="/" className="inline-block mb-8">
          <NexusLogo size="lg" className="justify-center" />
        </Link>

        <SciFiFrame glowIntensity="medium" className="p-10">
          <div className="w-20 h-20 mx-auto mb-6 border-2 border-destructive/60 bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="font-display text-6xl font-bold text-foreground mb-4">
            <span className="text-gradient">404</span>
          </h1>
          
          <p className="text-xl font-display uppercase tracking-widest text-muted-foreground mb-2">
            Signal Lost
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            The coordinates you're looking for don't exist in this dimension.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <SciFiButton variant="primary" shape="angled" className="gap-2">
                <Home className="w-4 h-4" />
                Return Home
              </SciFiButton>
            </Link>
            <SciFiButton 
              variant="default" 
              shape="angled" 
              className="gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </SciFiButton>
          </div>
        </SciFiFrame>

        <p className="mt-8 text-xs font-display uppercase tracking-widest text-muted-foreground">
          Error Code: DIMENSION_NOT_FOUND
        </p>
      </div>
    </div>
  );
};

export default NotFound;
