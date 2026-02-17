import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Supported languages with their codes and display names
export const supportedLanguages = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
} as const;

// Localized placeholder text for prompts
export const promptPlaceholders: Record<LanguageCode, string> = {
  en: "Describe your vision... Be creative and detailed! 🎨",
  es: "Describe tu visión... ¡Sé creativo y detallado! 🎨",
  fr: "Décrivez votre vision... Soyez créatif et détaillé ! 🎨",
  de: "Beschreibe deine Vision... Sei kreativ und detailliert! 🎨",
  it: "Descrivi la tua visione... Sii creativo e dettagliato! 🎨",
  pt: "Descreva sua visão... Seja criativo e detalhado! 🎨",
  ja: "あなたのビジョンを描いてください... 創造的で詳細に! 🎨",
  ko: "당신의 비전을 설명하세요... 창의적이고 자세하게! 🎨",
  zh: "描述你的愿景... 发挥创意，详细描述！🎨",
  ar: "صف رؤيتك... كن مبدعاً ومفصلاً! 🎨",
  hi: "अपनी दृष्टि का वर्णन करें... रचनात्मक और विस्तृत रहें! 🎨",
  ru: "Опишите своё видение... Будьте креативны и детальны! 🎨",
};

// Culturally relevant quick prompts for each language, organized by category
export type PromptCategory = 'all' | 'nature' | 'fantasy' | 'scifi';

export const categoryLabels: Record<PromptCategory, Record<LanguageCode, string>> = {
  all: {
    en: 'All', es: 'Todo', fr: 'Tout', de: 'Alle', it: 'Tutto', pt: 'Tudo',
    ja: 'すべて', ko: '전체', zh: '全部', ar: 'الكل', hi: 'सभी', ru: 'Все'
  },
  nature: {
    en: 'Nature', es: 'Naturaleza', fr: 'Nature', de: 'Natur', it: 'Natura', pt: 'Natureza',
    ja: '自然', ko: '자연', zh: '自然', ar: 'طبيعة', hi: 'प्रकृति', ru: 'Природа'
  },
  fantasy: {
    en: 'Fantasy', es: 'Fantasía', fr: 'Fantaisie', de: 'Fantasy', it: 'Fantasia', pt: 'Fantasia',
    ja: 'ファンタジー', ko: '판타지', zh: '奇幻', ar: 'خيال', hi: 'काल्पनिक', ru: 'Фэнтези'
  },
  scifi: {
    en: 'Sci-Fi', es: 'Ciencia Ficción', fr: 'Sci-Fi', de: 'Sci-Fi', it: 'Fantascienza', pt: 'Ficção Científica',
    ja: 'SF', ko: 'SF', zh: '科幻', ar: 'خيال علمي', hi: 'विज्ञान कथा', ru: 'Sci-Fi'
  }
};

export interface CategorizedPrompt {
  text: string;
  category: Exclude<PromptCategory, 'all'>;
}

export const categorizedPrompts: Record<LanguageCode, CategorizedPrompt[]> = {
  en: [
    { text: "Bioluminescent ocean with glowing jellyfish at night", category: "nature" },
    { text: "Majestic waterfall in an ancient forest with rainbow mist", category: "nature" },
    { text: "Northern lights dancing over snow-capped mountains", category: "nature" },
    { text: "A dragon guarding a treasure in a crystal cave", category: "fantasy" },
    { text: "Magical treehouse village with fairy lights", category: "fantasy" },
    { text: "Wizard's tower floating among the clouds", category: "fantasy" },
    { text: "Neon-lit cyberpunk street at midnight", category: "scifi" },
    { text: "Futuristic space station orbiting a colorful nebula", category: "scifi" },
    { text: "Robot and human friendship in a garden city", category: "scifi" },
  ],
  es: [
    { text: "Selva amazónica mágica con animales luminosos", category: "nature" },
    { text: "Volcán activo con lava brillante bajo las estrellas", category: "nature" },
    { text: "Playa tropical con aguas cristalinas y peces de colores", category: "nature" },
    { text: "Dragón volando sobre las pirámides aztecas al atardecer", category: "fantasy" },
    { text: "Castillo encantado en las montañas con hadas", category: "fantasy" },
    { text: "Sirenas bailando bajo la luna en el Caribe", category: "fantasy" },
    { text: "Ciudad futurista mexicana con pirámides tecnológicas", category: "scifi" },
    { text: "Astronautas explorando un nuevo planeta colorido", category: "scifi" },
    { text: "Robots amigables ayudando en una granja del futuro", category: "scifi" },
  ],
  fr: [
    { text: "Jardins de Giverny avec des fleurs magiques géantes", category: "nature" },
    { text: "Mont-Saint-Michel entouré d'aurores boréales", category: "nature" },
    { text: "Forêt enchantée avec des lucioles dansantes", category: "nature" },
    { text: "La Tour Eiffel transformée en arbre géant magique", category: "fantasy" },
    { text: "Château de conte de fées dans les Alpes avec dragons", category: "fantasy" },
    { text: "Fées et licornes dans les jardins de Versailles", category: "fantasy" },
    { text: "Paris sous-marin futuriste avec bulles et lumières", category: "scifi" },
    { text: "Station spatiale française avec vue sur la Terre", category: "scifi" },
    { text: "Voitures volantes au-dessus des Champs-Élysées", category: "scifi" },
  ],
  de: [
    { text: "Magischer Schwarzwald mit leuchtenden Pilzen", category: "nature" },
    { text: "Alpen bei Sonnenaufgang mit fliegenden Adlern", category: "nature" },
    { text: "Mystischer See mit Nebel und glühenden Seerosen", category: "nature" },
    { text: "Schloss Neuschwanstein bewacht von freundlichen Drachen", category: "fantasy" },
    { text: "Zwerge und Elfen in einer unterirdischen Kristallhöhle", category: "fantasy" },
    { text: "Fliegender Weihnachtsmarkt über den Wolken", category: "fantasy" },
    { text: "Futuristische Stadt Berlin im Jahr 3000", category: "scifi" },
    { text: "Deutsche Roboter-Ingenieure bauen Raumschiffe", category: "scifi" },
    { text: "Neon-beleuchtete Autobahn der Zukunft", category: "scifi" },
  ],
  it: [
    { text: "Costa Amalfitana con onde luminose e delfini magici", category: "nature" },
    { text: "Toscana al tramonto con girasoli giganti dorati", category: "nature" },
    { text: "Dolomiti innevate con aurora boreale", category: "nature" },
    { text: "Il Colosseo come arena di gladiatori magici", category: "fantasy" },
    { text: "Venezia flottante tra le nuvole con gondole volanti", category: "fantasy" },
    { text: "Draghi amichevoli sulla cima del Vesuvio", category: "fantasy" },
    { text: "Roma futuristica con ologrammi di antichi imperatori", category: "scifi" },
    { text: "Stazione spaziale italiana a forma di pizza", category: "scifi" },
    { text: "Robot chef che prepara pasta in una cucina hi-tech", category: "scifi" },
  ],
  pt: [
    { text: "Floresta amazônica com criaturas bioluminescentes", category: "nature" },
    { text: "Cataratas do Iguaçu com arco-íris duplo mágico", category: "nature" },
    { text: "Praia brasileira com ondas de cristal e peixes coloridos", category: "nature" },
    { text: "Cristo Redentor como guardião de dragões mágicos", category: "fantasy" },
    { text: "Sereias e golfinhos mágicos na Baía de Guanabara", category: "fantasy" },
    { text: "Floresta encantada com curupiras e sacis", category: "fantasy" },
    { text: "São Paulo futurista com arranha-céus flutuantes", category: "scifi" },
    { text: "Carnaval futurista com robôs dançarinos coloridos", category: "scifi" },
    { text: "Nave espacial brasileira explorando a Via Láctea", category: "scifi" },
  ],
  ja: [
    { text: "富士山と満開の桜、蝶が舞う春の風景", category: "nature" },
    { text: "京都の竹林に差し込む神秘的な光", category: "nature" },
    { text: "沖縄のサンゴ礁と虹色の熱帯魚", category: "nature" },
    { text: "忍者と侍が守る空に浮かぶ魔法の城", category: "fantasy" },
    { text: "ドラゴンと鳳凰が舞う神社の夜空", category: "fantasy" },
    { text: "妖精たちが住む光る森の中の村", category: "fantasy" },
    { text: "ネオン輝く未来の東京タワーと飛行車", category: "scifi" },
    { text: "宇宙を旅する巨大な鯉のぼり型宇宙船", category: "scifi" },
    { text: "ロボットメイドカフェの未来版", category: "scifi" },
  ],
  ko: [
    { text: "제주도의 환상적인 일출과 유채꽃 들판", category: "nature" },
    { text: "설악산의 단풍과 안개 속 신비로운 폭포", category: "nature" },
    { text: "빛나는 반딧불이가 가득한 한국의 숲", category: "nature" },
    { text: "한복을 입은 용이 지키는 마법의 경복궁", category: "fantasy" },
    { text: "구미호와 도깨비가 사는 신비로운 마을", category: "fantasy" },
    { text: "달빛 아래 춤추는 선녀와 나무꾼", category: "fantasy" },
    { text: "네온 한글 간판이 빛나는 사이버펑크 서울", category: "scifi" },
    { text: "우주 정거장에서 본 한반도의 야경", category: "scifi" },
    { text: "미래의 K-pop 로봇 아이돌 콘서트", category: "scifi" },
  ],
  zh: [
    { text: "张家界的云海与神秘的飞瀑", category: "nature" },
    { text: "桂林山水间的萤火虫之夜", category: "nature" },
    { text: "西藏高原上的银河与星空", category: "nature" },
    { text: "龙在长城上空飞翔的奇幻夜景", category: "fantasy" },
    { text: "熊猫战士在竹林中练习武术", category: "fantasy" },
    { text: "凤凰与麒麟守护的仙境宫殿", category: "fantasy" },
    { text: "未来科技版的紫禁城与飞行汽车", category: "scifi" },
    { text: "上海2100年的霓虹都市景观", category: "scifi" },
    { text: "中国空间站上的太空花园", category: "scifi" },
  ],
  ar: [
    { text: "واحة صحراوية سحرية مع نخيل متوهج ونجوم", category: "nature" },
    { text: "شروق الشمس فوق الأهرامات مع طيور ذهبية", category: "nature" },
    { text: "بحر أحمر مع شعاب مرجانية ملونة وأسماك مضيئة", category: "nature" },
    { text: "قصر من ألف ليلة وليلة مع سجاد طائر وجن", category: "fantasy" },
    { text: "تنين عربي يحرس كنوز مدينة مفقودة", category: "fantasy" },
    { text: "حورية بحر عربية في قصر تحت الماء", category: "fantasy" },
    { text: "مدينة عربية مستقبلية تطفو فوق الصحراء", category: "scifi" },
    { text: "برج خليفة كمحطة فضائية في عام 3000", category: "scifi" },
    { text: "روبوتات ودية تقدم القهوة العربية", category: "scifi" },
  ],
  hi: [
    { text: "हिमालय पर बर्फीली चोटियों के बीच सूर्योदय", category: "nature" },
    { text: "केरल के बैकवाटर में चमकती जुगनू रात", category: "nature" },
    { text: "राजस्थान के रेगिस्तान में तारों भरी रात", category: "nature" },
    { text: "ताज महल के ऊपर उड़ते जादुई मोर और परियां", category: "fantasy" },
    { text: "हनुमान जी और जादुई बंदरों का साहसिक कारनामा", category: "fantasy" },
    { text: "दीपावली की रात में जादुई आतिशबाजी और देवता", category: "fantasy" },
    { text: "भविष्य का दिल्ली शहर रोबोट और होलोग्राम के साथ", category: "scifi" },
    { text: "अंतरिक्ष में तैरता भारतीय मंदिर", category: "scifi" },
    { text: "मंगल ग्रह पर भारतीय वैज्ञानिकों की बस्ती", category: "scifi" },
  ],
  ru: [
    { text: "Байкал зимой с северным сиянием и звёздами", category: "nature" },
    { text: "Камчатские гейзеры в волшебном тумане", category: "nature" },
    { text: "Сибирская тайга с светящимися грибами", category: "nature" },
    { text: "Кремль в волшебном северном сиянии с драконами", category: "fantasy" },
    { text: "Баба Яга и её избушка в заколдованном лесу", category: "fantasy" },
    { text: "Жар-птица над златоглавыми куполами", category: "fantasy" },
    { text: "Футуристический Санкт-Петербург на летающих островах", category: "scifi" },
    { text: "Матрёшки-роботы в неоновом городе будущего", category: "scifi" },
    { text: "Российская космическая станция у колец Сатурна", category: "scifi" },
  ],
};

// Helper to get prompts filtered by category
export const getPromptsByCategory = (
  language: LanguageCode, 
  category: PromptCategory
): string[] => {
  const prompts = categorizedPrompts[language] || categorizedPrompts.en;
  if (category === 'all') {
    return prompts.map(p => p.text);
  }
  return prompts.filter(p => p.category === category).map(p => p.text);
};

// Legacy export for backward compatibility
export const quickPrompts: Record<LanguageCode, string[]> = Object.fromEntries(
  Object.keys(supportedLanguages).map(lang => [
    lang,
    categorizedPrompts[lang as LanguageCode]?.map(p => p.text) || []
  ])
) as Record<LanguageCode, string[]>;

export type LanguageCode = keyof typeof supportedLanguages;

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  detectLanguage: (text: string) => LanguageCode;
  autoDetect: boolean;
  setAutoDetect: (value: boolean) => void;
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (value: boolean) => void;
  isVoiceSupported: boolean;
  getLanguageInfo: (code: LanguageCode) => typeof supportedLanguages[LanguageCode];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple language detection based on character patterns
function detectLanguageFromText(text: string): LanguageCode {
  if (!text || text.length < 3) return 'en';
  
  // Check for specific character sets
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const hasKorean = /[\uac00-\ud7af]/.test(text);
  const hasChinese = /[\u4e00-\u9fff]/.test(text) && !hasJapanese;
  const hasArabic = /[\u0600-\u06ff]/.test(text);
  const hasHindi = /[\u0900-\u097f]/.test(text);
  const hasRussian = /[\u0400-\u04ff]/.test(text);
  
  if (hasJapanese) return 'ja';
  if (hasKorean) return 'ko';
  if (hasChinese) return 'zh';
  if (hasArabic) return 'ar';
  if (hasHindi) return 'hi';
  if (hasRussian) return 'ru';
  
  // For Latin-based languages, use common word patterns
  const lowerText = text.toLowerCase();
  
  // Spanish patterns
  if (/\b(el|la|los|las|un|una|es|está|son|tienen|para|con|por)\b/i.test(lowerText)) return 'es';
  
  // French patterns
  if (/\b(le|la|les|un|une|est|sont|avec|pour|dans|sur)\b/i.test(lowerText)) return 'fr';
  
  // German patterns
  if (/\b(der|die|das|ein|eine|ist|sind|mit|für|und|oder)\b/i.test(lowerText)) return 'de';
  
  // Italian patterns
  if (/\b(il|la|lo|gli|le|un|una|è|sono|con|per)\b/i.test(lowerText)) return 'it';
  
  // Portuguese patterns
  if (/\b(o|a|os|as|um|uma|é|são|com|para|em)\b/i.test(lowerText)) return 'pt';
  
  // Default to English
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved && saved in supportedLanguages) {
      return saved as LanguageCode;
    }
    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in supportedLanguages) {
      return browserLang as LanguageCode;
    }
    return 'en';
  });

  const [autoDetect, setAutoDetect] = useState(() => {
    return localStorage.getItem('autoDetectLanguage') !== 'false';
  });

  const [voiceInputEnabled, setVoiceInputEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceInputEnabled');
    return saved === null ? true : saved === 'true'; // Default to true
  });

  const [isVoiceSupported] = useState(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });

  // Save preferences
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
    localStorage.setItem('autoDetectLanguage', String(autoDetect));
    localStorage.setItem('voiceInputEnabled', String(voiceInputEnabled));
  }, [currentLanguage, autoDetect, voiceInputEnabled]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    const prevLang = currentLanguage;
    setCurrentLanguage(lang);
    
    // Dispatch a custom event to notify components about language change
    if (prevLang !== lang) {
      const langInfo = supportedLanguages[lang];
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { 
          from: prevLang, 
          to: lang, 
          languageInfo: langInfo 
        } 
      }));
    }
  }, [currentLanguage]);

  const detectLanguage = useCallback((text: string): LanguageCode => {
    if (!autoDetect) return currentLanguage;
    return detectLanguageFromText(text);
  }, [autoDetect, currentLanguage]);

  const getLanguageInfo = useCallback((code: LanguageCode) => {
    return supportedLanguages[code];
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      detectLanguage,
      autoDetect,
      setAutoDetect,
      voiceInputEnabled,
      setVoiceInputEnabled,
      isVoiceSupported,
      getLanguageInfo,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
