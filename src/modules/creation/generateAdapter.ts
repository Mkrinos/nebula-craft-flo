import { supabase } from '@/integrations/supabase/client';
import type { GenerateFn } from './useCreationJourney';
import { composePrompt } from './descriptors';

/**
 * Default generate adapter that calls the existing `generate-image` edge
 * function. The adapter is now the source of truth for the final prompt:
 * it routes the spec through composePrompt (which applies the SAFETY_PREAMBLE,
 * the descriptor library, free-text sanitisation, and the NEGATIVE_PROMPT),
 * then inlines the negative-prompt exclusions because the edge function does
 * not accept a dedicated negativePrompt field.
 */
export const invokeGenerateImage: GenerateFn = async ({ spec, labels }) => {
  const { prompt, negativePrompt, authorshipSummary } = composePrompt(spec, { labels });
  const finalPrompt = `${prompt}\n\nAvoid: ${negativePrompt}`;

  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: {
      prompt: finalPrompt,
      style: spec.styleId ?? undefined,
      saveToGallery: true,
    },
  });

  if (error) {
    let detail = error.message || 'Generation failed';
    // supabase.functions.invoke stashes the underlying Response on `context`.
    // The JSON body holds the real `{ error: "..." }` message from the edge fn.
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.clone().json().catch(() => null);
        if (body && typeof body.error === 'string' && body.error.trim()) {
          detail = body.error;
        }
      }
    } catch {
      /* keep generic message */
    }
    const limitReached = /limit|credit|quota|upgrade|plan|402|403/i.test(detail);
    return { image: '', error: detail, limitReached, authorshipSummary };
  }

  if (data?.error) {
    const limitReached = /limit|credit|quota|upgrade|plan/i.test(data.error);
    return { image: '', error: data.error, limitReached, authorshipSummary };
  }

  return {
    image: data?.image ?? '',
    saved: !!data?.saved,
    cached: !!data?.cached,
    authorshipSummary,
  };
};
