import { supabase } from '@/integrations/supabase/client';
import type { GenerateFn } from './useCreationJourney';

/**
 * Default generate adapter that calls the existing `generate-image` edge
 * function. Reused by every surface that mounts <CreationJourney/>.
 */
export const invokeGenerateImage: GenerateFn = async ({ prompt, style }) => {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: { prompt, style: style ?? undefined, saveToGallery: true },
  });

  if (error) {
    // supabase-js wraps non-2xx responses; treat 402/403 as plan-limit
    const message = error.message || 'Generation failed';
    const limitReached = /limit|credit|quota|402|403/i.test(message);
    return { image: '', error: limitReached ? message : message, limitReached };
  }

  if (data?.error) {
    const limitReached = /limit|credit|quota|upgrade/i.test(data.error);
    return { image: '', error: data.error, limitReached };
  }

  return {
    image: data?.image ?? '',
    saved: !!data?.saved,
    cached: !!data?.cached,
  };
};
