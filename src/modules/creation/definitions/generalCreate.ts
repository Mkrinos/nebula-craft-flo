import type { JourneyDefinition } from '../types';

export const generalCreateDefinition: JourneyDefinition = {
  id: 'general-create-v1',
  steps: [
    {
      id: 'subject',
      hostLine: 'What do you want to create?',
      choices: [
        { id: 'creature', label: 'A creature', emoji: '🐾', promptFragment: 'a unique creature', previewLayer: { kind: 'text', value: '🐾', label: 'creature' } },
        { id: 'place', label: 'A place', emoji: '🏞️', promptFragment: 'a magical place', previewLayer: { kind: 'text', value: '🏞️', label: 'place' } },
        { id: 'vehicle', label: 'A vehicle', emoji: '🚀', promptFragment: 'an inventive vehicle', previewLayer: { kind: 'text', value: '🚀', label: 'vehicle' } },
        { id: 'object', label: 'An object', emoji: '🔮', promptFragment: 'a curious object', previewLayer: { kind: 'text', value: '🔮', label: 'object' } },
      ],
    },
    {
      id: 'vibe',
      hostLine: "What's it like?",
      choices: [
        { id: 'brave', label: 'Brave', emoji: '🛡️', promptFragment: 'brave and bold', previewLayer: { kind: 'color', value: '#5BCEFA', label: 'brave' } },
        { id: 'curious', label: 'Curious', emoji: '🔭', promptFragment: 'curious and wide-eyed', previewLayer: { kind: 'color', value: '#B8A4E3', label: 'curious' } },
        { id: 'silly', label: 'Silly', emoji: '🎈', promptFragment: 'silly and playful', previewLayer: { kind: 'color', value: '#FFD166', label: 'silly' } },
        { id: 'mysterious', label: 'Mysterious', emoji: '🌒', promptFragment: 'mysterious and shadowy', previewLayer: { kind: 'color', value: '#6A4FB6', label: 'mysterious' } },
      ],
    },
    {
      id: 'home',
      hostLine: 'Where does it belong?',
      choices: [
        { id: 'forest', label: 'Forest', emoji: '🌲', promptFragment: 'in an enchanted forest', previewLayer: { kind: 'color', value: '#2BBF7A', label: 'forest' } },
        { id: 'ocean', label: 'Ocean', emoji: '🌊', promptFragment: 'in a deep glowing ocean', previewLayer: { kind: 'color', value: '#1F9AD6', label: 'ocean' } },
        { id: 'space', label: 'Space', emoji: '🌌', promptFragment: 'among the stars in space', previewLayer: { kind: 'color', value: '#0A1A3D', label: 'space' } },
        { id: 'city', label: 'City', emoji: '🏙️', promptFragment: 'in a luminous city', previewLayer: { kind: 'color', value: '#E26D9C', label: 'city' } },
      ],
    },
    {
      id: 'detail',
      hostLine: "Add a detail that's yours.",
      choices: [
        { id: 'glow', label: 'Glowing markings', emoji: '✨', promptFragment: 'with glowing markings', previewLayer: { kind: 'text', value: '✨', label: 'glow' } },
        { id: 'wings', label: 'Hidden wings', emoji: '🪽', promptFragment: 'with hidden wings', previewLayer: { kind: 'text', value: '🪽', label: 'wings' } },
        { id: 'crystals', label: 'Crystals', emoji: '💎', promptFragment: 'covered in soft crystals', previewLayer: { kind: 'text', value: '💎', label: 'crystals' } },
        { id: 'flames', label: 'Friendly flames', emoji: '🔥', promptFragment: 'wrapped in friendly flames', previewLayer: { kind: 'text', value: '🔥', label: 'flames' } },
      ],
    },
    {
      id: 'style',
      kind: 'style',
      hostLine: 'Pick a Style (optional).',
      optional: true,
    },
    {
      id: 'freeText',
      kind: 'freeText',
      hostLine: 'Anything else? (optional)',
      optional: true,
      placeholder: 'Add your own words — totally optional.',
    },
    {
      id: 'claim',
      kind: 'claim',
      hostLine: 'Name it and claim it.',
    },
  ],
};
