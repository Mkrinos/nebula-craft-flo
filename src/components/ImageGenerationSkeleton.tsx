import React, { forwardRef } from 'react';
import { Sparkles, Wand2, Image } from 'lucide-react';

const ImageGenerationSkeleton = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Animated skeleton frame */}
      <div className="relative w-full max-w-xs aspect-square mb-4 sm:mb-6">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-lg border-2 border-neon-cyan/20 animate-pulse" />
        
        {/* Inner skeleton blocks mimicking image generation */}
        <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i}
              className="bg-neon-cyan/10 rounded animate-pulse"
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
        
        {/* Scanning line effect */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div 
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent"
            style={{
              animation: 'scan 2s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-neon-cyan/30 animate-pulse" />
            <Sparkles className="relative w-10 h-10 sm:w-12 sm:h-12 text-neon-cyan animate-pulse" />
          </div>
        </div>
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-neon-cyan/40" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-neon-cyan/40" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-neon-cyan/40" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-neon-cyan/40" />
      </div>
      
      {/* Text skeleton */}
      <div className="text-center space-y-3 w-full max-w-xs">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
          <p className="font-display text-base sm:text-lg text-foreground">Creating Magic...</p>
        </div>
        
        {/* Animated progress bar */}
        <div className="relative h-1.5 bg-space-dark/80 rounded-full overflow-hidden border border-neon-cyan/20">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple rounded-full"
            style={{
              animation: 'shimmer 2s ease-in-out infinite',
              width: '60%',
            }}
          />
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your masterpiece is being generated
        </p>
        
        {/* Animated feature indicators */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse">
            <Wand2 className="w-3 h-3" />
            <span>Enhancing</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse" style={{ animationDelay: '300ms' }}>
            <Image className="w-3 h-3" />
            <span>Rendering</span>
          </div>
        </div>
      </div>
      
      {/* CSS for custom animations */}
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(60%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
});

ImageGenerationSkeleton.displayName = 'ImageGenerationSkeleton';

export default ImageGenerationSkeleton;
