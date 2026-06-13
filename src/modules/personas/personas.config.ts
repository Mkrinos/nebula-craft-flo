import novaAsset from "./assets/nova.mp4.asset.json";
import emberAsset from "./assets/ember.mp4.asset.json";
import lyraAsset from "./assets/lyra.mp4.asset.json";
import vexAsset from "./assets/vex.mp4.asset.json";
import haloAsset from "./assets/halo.mp4.asset.json";
import onyxAsset from "./assets/onyx.mp4.asset.json";

export type Interest =
  | "animals"
  | "space"
  | "fantasy"
  | "mystery"
  | "art"
  | "science"
  | "music"
  | "nature";

export const ALL_INTERESTS: Interest[] = [
  "animals",
  "space",
  "fantasy",
  "mystery",
  "art",
  "science",
  "music",
  "nature",
];

export type PersonaId = "nova" | "ember" | "lyra" | "vex" | "halo" | "onyx";

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  shortName: string;
  description: string;
  /** Short style descriptor appended to image prompts. */
  styleDescriptor: string;
  /** Short flavor passed to quest LLM call. */
  questVoice: string;
  /** Hex accent for cards/arcs. */
  accent: string;
  /** ElevenLabs voice id reference (not invoked here). */
  voiceIdRef: string;
  interests: Interest[];
  videoUrl: string;
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: "nova",
    name: "Nova, the Sun-Mystic",
    shortName: "Nova",
    description:
      "A radiant guide who weaves golden light into wonder. Loves cosmic mysteries and shining ideas.",
    styleDescriptor: "radiant golden mystic light, soft sun-glow, dreamlike cosmic atmosphere",
    questVoice: "Speak with warm, hopeful wonder. Use gentle metaphors of sunlight and stars.",
    accent: "#FFC857",
    voiceIdRef: "nova_voice_ref",
    interests: ["space", "mystery", "art"],
    videoUrl: novaAsset.url,
  },
  {
    id: "ember",
    name: "Ember, the Solar Warrior",
    shortName: "Ember",
    description: "A brave, fiery champion of bold action and heroic adventures.",
    styleDescriptor: "bold solar fire, heroic warm tones, dynamic energetic composition",
    questVoice: "Speak with brave, encouraging energy. Cheer the child on like a fellow hero.",
    accent: "#FF6B35",
    voiceIdRef: "ember_voice_ref",
    interests: ["fantasy", "science", "animals"],
    videoUrl: emberAsset.url,
  },
  {
    id: "lyra",
    name: "Lyra, the Soft Dreamer",
    shortName: "Lyra",
    description: "A gentle dreamer painting the world in pastel calm and quiet songs.",
    styleDescriptor: "soft pastel dreamscape, calm lighting, gentle painterly textures",
    questVoice: "Speak softly and kindly. Use cozy, musical, dreamlike imagery.",
    accent: "#C8A8E9",
    voiceIdRef: "lyra_voice_ref",
    interests: ["music", "nature", "animals"],
    videoUrl: lyraAsset.url,
  },
  {
    id: "vex",
    name: "Vex, the Neon Trickster",
    shortName: "Vex",
    description: "A playful neon spark who loves surprises, jokes, and bright remixes.",
    styleDescriptor: "neon glow, playful electric colors, cyberpunk graffiti energy",
    questVoice: "Speak with playful, witty energy. Toss in friendly jokes and surprising twists.",
    accent: "#39FF14",
    voiceIdRef: "vex_voice_ref",
    interests: ["art", "music", "mystery"],
    videoUrl: vexAsset.url,
  },
  {
    id: "halo",
    name: "Halo, the Dawn Sentinel",
    shortName: "Halo",
    description: "A luminous guardian of the morning, calm, watchful, and kind.",
    styleDescriptor: "luminous dawn light, calm guardian presence, soft auroral palette",
    questVoice: "Speak with calm, reassuring guidance. Be steady, kind, and protective.",
    accent: "#7FD7FF",
    voiceIdRef: "halo_voice_ref",
    interests: ["nature", "fantasy", "space"],
    videoUrl: haloAsset.url,
  },
  {
    id: "onyx",
    name: "Onyx, the Void Sculptor",
    shortName: "Onyx",
    description: "A cosmic shaper of shadow and starlight who loves mysteries beyond the dark.",
    styleDescriptor: "deep cosmic shadow, sculpted starlight, mysterious void atmosphere",
    questVoice: "Speak with quiet, thoughtful curiosity. Invite the child to wonder about the unseen.",
    accent: "#8A50FF",
    voiceIdRef: "onyx_voice_ref",
    interests: ["science", "mystery", "space"],
    videoUrl: onyxAsset.url,
  },
];

export function getPersona(id: PersonaId | null | undefined): PersonaConfig | null {
  if (!id) return null;
  return PERSONAS.find((p) => p.id === id) ?? null;
}

/** Order personas by overlap with child's interests (descending). Stable for ties. */
export function orderByInterestFit(
  personas: PersonaConfig[],
  interests: Interest[],
): PersonaConfig[] {
  const set = new Set(interests);
  return [...personas]
    .map((p, idx) => ({
      p,
      idx,
      score: p.interests.reduce((acc, i) => acc + (set.has(i) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((x) => x.p);
}
