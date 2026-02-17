import React from 'react';
import { useSignedImageUrl } from '@/hooks/useSignedImageUrl';
import { cn } from '@/lib/utils';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: React.ReactNode;
}

/**
 * SecureImage component that automatically handles signed URLs for private storage buckets.
 * Use this instead of regular <img> tags for images from the generated-images bucket.
 */
const SecureImage = React.forwardRef<HTMLImageElement, SecureImageProps>(
  ({ src, alt, className, fallback, ...props }, ref) => {
    const { signedUrl, loading, error } = useSignedImageUrl(src);

    if (loading && !signedUrl) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div className={cn("animate-pulse bg-secondary/50", className)} />
      );
    }

    if (error && !signedUrl) {
      return (
        <div className={cn("flex items-center justify-center bg-secondary/30 text-muted-foreground text-xs", className)}>
          Failed to load
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={signedUrl || src}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }
);

SecureImage.displayName = 'SecureImage';

export default SecureImage;
