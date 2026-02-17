import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Cache for signed URLs to avoid redundant requests
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// Buffer before expiry to refresh (5 minutes)
const EXPIRY_BUFFER = 5 * 60 * 1000;

/**
 * Hook to get a signed URL for a single image
 */
export const useSignedImageUrl = (originalUrl: string | undefined | null) => {
  const { user } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!originalUrl) {
      setSignedUrl(null);
      return;
    }

    // Check if URL is already a signed URL or external
    if (originalUrl.includes('token=') || !originalUrl.includes('generated-images')) {
      setSignedUrl(originalUrl);
      return;
    }

    // Check cache first
    const cached = signedUrlCache.get(originalUrl);
    if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER) {
      setSignedUrl(cached.url);
      return;
    }

    const fetchSignedUrl = async () => {
      if (!user) {
        // For non-authenticated users, try to use original URL as fallback
        setSignedUrl(originalUrl);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
          body: { paths: [originalUrl] }
        });

        if (fnError) throw fnError;

        if (data?.signedUrls?.[originalUrl]) {
          const newSignedUrl = data.signedUrls[originalUrl];
          const expiresIn = data.expiresIn || 3600;
          
          // Cache the signed URL
          signedUrlCache.set(originalUrl, {
            url: newSignedUrl,
            expiresAt: Date.now() + expiresIn * 1000
          });
          
          setSignedUrl(newSignedUrl);
        } else {
          throw new Error(data?.errors?.[originalUrl] || 'Failed to get signed URL');
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
        // Fallback to original URL
        setSignedUrl(originalUrl);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [originalUrl, user]);

  return { signedUrl, loading, error };
};

/**
 * Hook to get signed URLs for multiple images at once (batch)
 */
export const useSignedImageUrls = (originalUrls: string[]) => {
  const { user } = useAuth();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchSignedUrls = useCallback(async (urls: string[]) => {
    if (!user || urls.length === 0) return;

    // Filter URLs that need signing and aren't cached
    const urlsToSign = urls.filter(url => {
      if (!url) return false;
      if (url.includes('token=') || !url.includes('generated-images')) return false;
      
      const cached = signedUrlCache.get(url);
      if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER) {
        return false;
      }
      
      if (fetchedRef.current.has(url)) return false;
      
      return true;
    });

    // Get cached URLs
    const cachedResults: Record<string, string> = {};
    urls.forEach(url => {
      if (!url) return;
      
      // Non-generated-images URLs or already signed
      if (url.includes('token=') || !url.includes('generated-images')) {
        cachedResults[url] = url;
        return;
      }
      
      const cached = signedUrlCache.get(url);
      if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER) {
        cachedResults[url] = cached.url;
      }
    });

    setSignedUrls(prev => ({ ...prev, ...cachedResults }));

    if (urlsToSign.length === 0) return;

    setLoading(true);
    setError(null);

    // Mark as being fetched
    urlsToSign.forEach(url => fetchedRef.current.add(url));

    try {
      // Batch in groups of 50
      for (let i = 0; i < urlsToSign.length; i += 50) {
        const batch = urlsToSign.slice(i, i + 50);
        
        const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
          body: { paths: batch }
        });

        if (fnError) throw fnError;

        if (data?.signedUrls) {
          const expiresIn = data.expiresIn || 3600;
          
          Object.entries(data.signedUrls).forEach(([originalUrl, signedUrl]) => {
            signedUrlCache.set(originalUrl, {
              url: signedUrl as string,
              expiresAt: Date.now() + expiresIn * 1000
            });
          });
          
          setSignedUrls(prev => ({ ...prev, ...data.signedUrls }));
        }
      }
    } catch (err) {
      console.error('Error fetching signed URLs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      
      // Fallback to original URLs
      const fallback: Record<string, string> = {};
      urlsToSign.forEach(url => { fallback[url] = url; });
      setSignedUrls(prev => ({ ...prev, ...fallback }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSignedUrls(originalUrls);
  }, [originalUrls.join(','), fetchSignedUrls]);

  const getSignedUrl = useCallback((originalUrl: string) => {
    return signedUrls[originalUrl] || originalUrl;
  }, [signedUrls]);

  return { signedUrls, getSignedUrl, loading, error, refetch: fetchSignedUrls };
};

/**
 * Clear the signed URL cache (useful on logout)
 */
export const clearSignedUrlCache = () => {
  signedUrlCache.clear();
};
