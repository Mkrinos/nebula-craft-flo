import type { CreationSpec } from './types';

/**
 * Safety scaffold prepended to every prompt. Keeps the model in a
 * wholesome, age-appropriate register for the 10–16 target audience.
 */
export const SAFETY_PREAMBLE =
  'A friendly, age-appropriate illustration created by a young artist (ages 10–16). ' +
  'Wholesome, imaginative, non-violent, fully clothed characters, no realistic gore, ' +
  'no scary photoreal horror, no sexualised content, no real public figures, no trademarked ' +
  'characters or brand logos. Focus on warmth, wonder, and clear silhouettes.';

/**
 * Exclusion list. The image edge function does not accept a dedicated
 * negativePrompt field, so the adapter inlines this string into the
 * outgoing prompt under an "Avoid:" header.
 */
export const NEGATIVE_PROMPT = [
  'nsfw', 'nudity', 'sexualised', 'suggestive', 'gore', 'blood', 'wounds',
  'realistic weapons aimed at people', 'photoreal horror', 'jump scare',
  'self-harm', 'drugs', 'alcohol', 'cigarettes',
  'real public figures', 'celebrity likeness', 'copyrighted characters',
  'trademark logos', 'brand names', 'watermark', 'signature', 'text artifacts',
  'low quality', 'blurry', 'jpeg artifacts', 'deformed anatomy',
  'extra limbs', 'extra fingers', 'fused fingers', 'malformed face',
].join(', ');

interface Descriptor {
  /** Rich descriptor sentence fragment sent to the image model. */
  prompt: string;
  /** Short, child-voice phrasing used in the authorship summary. */
  summary: string;
}

type StepKey = 'subject' | 'vibe' | 'home' | 'detail' | 'style';

export type CreationChoices = Partial<Record<StepKey, string>>;

export const DESCRIPTORS: Record<StepKey, Record<string, Descriptor>> = {
  subject: {
    creature: {
      prompt:
        'a single original creature character as the clear focal subject, expressive eyes, ' +
        'friendly posture, full body visible, centred composition',
      summary: 'a creature',
    },
    place: {
      prompt:
        'an imaginative original place as the main scene, a clear landscape vista with depth, ' +
        'inviting atmosphere, no people required',
      summary: 'a place',
    },
    vehicle: {
      prompt:
        'an inventive original vehicle as the main subject, clean silhouette, three-quarter ' +
        'view, plausible mechanical detail, no real-world brand markings',
      summary: 'a vehicle',
    },
    object: {
      prompt:
        'a curious original object as the centred subject, hero-shot framing, intriguing ' +
        'shape, soft rim light to define the form',
      summary: 'an object',
    },
  },
  vibe: {
    brave: {
      prompt: 'with a brave and bold mood, confident pose, heroic light',
      summary: 'brave',
    },
    curious: {
      prompt: 'with a curious and wide-eyed mood, gentle wonder, soft inquisitive expression',
      summary: 'curious',
    },
    silly: {
      prompt: 'with a silly and playful mood, cheerful exaggerated proportions, bright friendly palette',
      summary: 'silly',
    },
    mysterious: {
      prompt: 'with a mysterious and dreamy mood, soft shadows, moody but never frightening',
      summary: 'mysterious',
    },
  },
  home: {
    forest: {
      prompt:
        'set in an enchanted forest, dappled sunlight through tall trees, mossy ground, ' +
        'glowing flora, layered depth',
      summary: 'in the forest',
    },
    ocean: {
      prompt:
        'set in a glowing deep ocean, soft caustic light filtering down, bioluminescent ' +
        'particles, peaceful current',
      summary: 'in the ocean',
    },
    space: {
      prompt:
        'set among the stars in deep space, distant nebula in indigo and cyan, gentle ' +
        'starlight, floating zero-gravity composition',
      summary: 'in space',
    },
    city: {
      prompt:
        'set in a luminous imaginary city at dusk, soft neon highlights, friendly cosy ' +
        'streetscape, no real-world brand signage',
      summary: 'in a glowing city',
    },
  },
  detail: {
    glow: {
      prompt: 'with soft glowing markings tracing the silhouette, gentle bloom',
      summary: 'with glowing markings',
    },
    wings: {
      prompt: 'with hidden translucent wings unfolding, delicate membrane catching light',
      summary: 'with hidden wings',
    },
    crystals: {
      prompt: 'covered in soft pastel crystals that refract a small rainbow',
      summary: 'covered in crystals',
    },
    flames: {
      prompt: 'wrapped in friendly stylised flames in cyan and lavender, decorative not destructive',
      summary: 'wrapped in friendly flames',
    },
  },
  style: {
    anime: {
      prompt:
        'rendered in modern anime illustration style, clean line art, cel-shaded colour, ' +
        'expressive eyes',
      summary: 'in anime style',
    },
    cartoon: {
      prompt:
        'rendered in a bold modern cartoon style, thick clean outlines, flat saturated colour, ' +
        'punchy shapes',
      summary: 'in cartoon style',
    },
    watercolor: {
      prompt:
        'rendered as a soft watercolour painting, visible paper grain, gentle pigment bleeds, ' +
        'pastel palette',
      summary: 'as a watercolour',
    },
    'pixel-art': {
      prompt:
        'rendered as crisp 32-bit pixel art, limited palette, clean dithering, sharp pixel edges, no anti-aliasing blur',
      summary: 'as pixel art',
    },
    fantasy: {
      prompt:
        'rendered as a painterly fantasy illustration, dramatic rim light, rich jewel tones, ' +
        'storybook composition',
      summary: 'as fantasy art',
    },
    'sci-fi': {
      prompt:
        'rendered as polished sci-fi concept art, sleek surfaces, cyan and lavender accent ' +
        'lighting, atmospheric haze',
      summary: 'as sci-fi concept art',
    },
  },
};

/**
 * Per-style closing quality tail. Only appended when a style is chosen.
 */
export const STYLE_QUALITY: Record<string, string> = {
  anime: 'crisp line work, balanced composition, professional anime key art quality',
  cartoon: 'clean vector-style finish, balanced composition, professional cartoon key art',
  watercolor: 'high-resolution scan quality, balanced composition, gallery-grade watercolour finish',
  'pixel-art': 'pristine pixel grid, no smoothing, professional pixel-art finish',
  fantasy: 'dramatic lighting, cinematic composition, professional fantasy illustration finish',
  'sci-fi': 'cinematic lighting, considered composition, professional concept-art finish',
};

const GENERIC_QUALITY_TAIL =
  'High quality, detailed, balanced composition, pleasing colour harmony, clear focal subject.';

const URL_RE = /\b((https?:\/\/|www\.)\S+)/gi;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi;
const MENTION_RE = /(^|\s)@\w+/g;
const CONTROL_RE = /[\u0000-\u001F\u007F]/g;
const UNSAFE_WORDS = [
  'nude', 'naked', 'sexy', 'sexual', 'porn', 'kill', 'murder', 'suicide',
  'gore', 'blood', 'weapon', 'gun', 'knife', 'drugs', 'cocaine', 'heroin',
  'racist', 'nazi', 'slur',
];
const UNSAFE_RE = new RegExp(`\\b(${UNSAFE_WORDS.join('|')})\\w*\\b`, 'gi');

/**
 * Sanitise child-provided free text before it joins the prompt.
 * Strips URLs, emails, mentions, control chars, unsafe vocabulary, and
 * caps at 200 characters. Returns an empty string if nothing safe remains.
 */
export function sanitizeFreeText(text: string | undefined | null): string {
  if (!text) return '';
  let out = String(text)
    .replace(CONTROL_RE, ' ')
    .replace(URL_RE, ' ')
    .replace(EMAIL_RE, ' ')
    .replace(MENTION_RE, ' ')
    .replace(UNSAFE_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (out.length > 200) out = out.slice(0, 200).trim();
  return out;
}

export interface ComposeResult {
  prompt: string;
  negativePrompt: string;
  authorshipSummary: string;
  usedFallback: boolean;
}

interface ComposeOptions {
  /** Optional map of stepId -> child-facing label, used in the authorship summary. */
  labels?: Record<string, string>;
}

/**
 * Build the final model prompt + authorship summary from a CreationSpec.
 * Maps engine step ids onto the descriptor library; unknown ids fall back
 * to a clean templated sentence using the supplied label.
 */
export function composePrompt(spec: CreationSpec, opts: ComposeOptions = {}): ComposeResult {
  const labels = opts.labels ?? {};
  let usedFallback = false;

  const choices = spec.choices ?? {};
  const order: StepKey[] = ['subject', 'vibe', 'home', 'detail'];
  const promptParts: string[] = [];
  const summaryParts: string[] = [];

  for (const key of order) {
    const choiceId = choices[key];
    if (!choiceId) continue;
    const desc = DESCRIPTORS[key]?.[choiceId];
    if (desc) {
      promptParts.push(desc.prompt);
      summaryParts.push(desc.summary);
    } else {
      usedFallback = true;
      const label = labels[key] || choiceId.replace(/[-_]/g, ' ');
      promptParts.push(`featuring ${label}`);
      summaryParts.push(label);
    }
  }

  const styleId = spec.styleId ?? null;
  if (styleId) {
    const styleDesc = DESCRIPTORS.style[styleId];
    if (styleDesc) {
      promptParts.push(styleDesc.prompt);
      const tail = STYLE_QUALITY[styleId];
      if (tail) promptParts.push(tail);
      summaryParts.push(styleDesc.summary);
    } else {
      usedFallback = true;
      const label = labels.style || styleId.replace(/[-_]/g, ' ');
      promptParts.push(`rendered in ${label} style`);
      summaryParts.push(`in ${label} style`);
    }
  }

  const safeFree = sanitizeFreeText(spec.freeText);
  if (safeFree) {
    promptParts.push(`additional child note: ${safeFree}`);
  }

  promptParts.push(GENERIC_QUALITY_TAIL);

  const prompt = [SAFETY_PREAMBLE, promptParts.join('. ')].join(' ');

  const name = (spec.childGivenName || '').trim();
  const who = name ? name : 'A young creator';
  const body = summaryParts.length
    ? summaryParts.join(', ')
    : 'something brand new';
  let authorshipSummary = `${who} made ${body}.`;
  if (safeFree) {
    authorshipSummary += ` They added: "${safeFree}".`;
  }

  return { prompt, negativePrompt: NEGATIVE_PROMPT, authorshipSummary, usedFallback };
}
