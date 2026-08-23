import type { POSType, VocabularyItem, VocabularySettings } from '@/types/domain';
import { DEFAULT_VOCAB_SETTINGS } from '@/types/domain';

export const LOCAL_JAR_KEY = 'ptp_vocabulary_jar_v1';
export const LOCAL_VOCAB_SETTINGS_KEY = 'ptp_vocabulary_settings_v1';

// Scientific and technical glossary dictionary
const TECHNICAL_GLOSSARY: Record<string, string> = {
  photosynthesis: 'The chemical process by which green plants synthesize nutrients from carbon dioxide and water using light.',
  biodiversity: 'The variety of plant and animal life in a particular habitat or in the world.',
  quantum: 'A discrete quantity of energy proportional in magnitude to the frequency of the radiation it represents.',
  neuroscience: 'Any or all of the sciences which deal with the structure or function of the nervous system and brain.',
  mitochondria: 'Organelles found in large numbers in most cells, in which cellular respiration and energy production occur.',
  algorithm: 'A process or set of rules to be followed in calculations or other problem-solving operations by a computer.',
  metabolism: 'The chemical processes that occur within a living organism in order to maintain life.',
  ecosystem: 'A biological community of interacting organisms and their physical environment.',
  nanotechnology: 'The branch of technology that deals with dimensions and tolerances of less than 100 nanometers.',
  astrophysics: 'The branch of astronomy concerned with the physical nature of stars and other celestial bodies.',
  thermodynamics: 'The branch of physical science that deals with the relations between heat and other forms of energy.',
  genomics: 'The branch of molecular biology concerned with the structure, function, evolution, and mapping of genomes.',
  biosphere: 'The regions of the surface, atmosphere, and hydrosphere of the earth occupied by living organisms.',
  cryptography: 'The art or practice of writing or solving codes to secure communication in the presence of third parties.',
  symbiosis: 'Interaction between two different biological organisms living in close physical association.',
};

// Words categorized by Part Of Speech
const ADJECTIVES = new Set([
  'ambient', 'brilliant', 'cognitive', 'complex', 'crucial', 'dense', 'dynamic',
  'ecological', 'efficient', 'elusive', 'essential', 'fundamental', 'intricate',
  'luminous', 'microscopic', 'profound', 'resilient', 'subtle', 'synthetic',
  'vital', 'vivid', 'proactive', 'persistent', 'accessible', 'concise', 'curated',
  'lightweight', 'flexible', 'robust', 'gentle', 'technical',
]);

const VERBS = new Set([
  'accelerate', 'adapt', 'analyze', 'synthesize', 'catalyze', 'cultivate',
  'deconstruct', 'diverge', 'illuminate', 'integrate', 'navigate', 'observe',
  'perceive', 'resonate', 'transform', 'validate', 'visualize', 'flourish',
  'emerge', 'reside', 'examine', 'optimize', 'collect', 'persist', 'highlight',
]);

const ADVERBS = new Set([
  'abruptly', 'densely', 'dynamically', 'efficiently', 'fundamentally', 'intricately',
  'profoundly', 'subtly', 'seamlessly', 'vividly', 'continually', 'meticulously',
  'rapidly', 'gradually', 'systematically', 'spontaneously', 'deliberately',
]);

const NOUNS = new Set([
  'hypothesis', 'paradigm', 'perspective', 'framework', 'spectrum', 'synthesis',
  'phenomenon', 'insight', 'catalyst', 'trajectory', 'mechanism', 'nuance',
  'concept', 'dimension', 'continuum', 'resonance', 'clarity', 'foundation',
  'velocity', 'equilibrium', 'retention', 'recollection', 'assistant', 'vocabulary',
]);

export interface WordAnalysis {
  word: string;
  cleanWord: string;
  pos: POSType;
  definition: string;
  isTechnical: boolean;
}

export type Token =
  | { type: 'text'; text: string }
  | { type: 'word'; text: string; analysis: WordAnalysis };

export function analyzeWord(rawWord: string): WordAnalysis | null {
  const cleanWord = rawWord.toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  if (!cleanWord || cleanWord.length <= 2) {
    return null;
  }

  if (TECHNICAL_GLOSSARY[cleanWord]) {
    return {
      word: rawWord,
      cleanWord,
      pos: 'technical',
      definition: TECHNICAL_GLOSSARY[cleanWord],
      isTechnical: true,
    };
  }

  if (ADJECTIVES.has(cleanWord) || (cleanWord.endsWith('ive') && cleanWord.length > 5) || (cleanWord.endsWith('ous') && cleanWord.length > 5)) {
    return {
      word: rawWord,
      cleanWord,
      pos: 'adjective',
      definition: `Describing quality or characteristic of ${cleanWord}.`,
      isTechnical: false,
    };
  }

  if (VERBS.has(cleanWord) || (cleanWord.endsWith('ize') && cleanWord.length > 5) || (cleanWord.endsWith('ate') && cleanWord.length > 5)) {
    return {
      word: rawWord,
      cleanWord,
      pos: 'verb',
      definition: `To perform the action of ${cleanWord}.`,
      isTechnical: false,
    };
  }

  if (ADVERBS.has(cleanWord) || (cleanWord.endsWith('ly') && cleanWord.length > 5)) {
    return {
      word: rawWord,
      cleanWord,
      pos: 'adverb',
      definition: `In a manner relating to ${cleanWord.replace(/ly$/, '')}.`,
      isTechnical: false,
    };
  }

  if (NOUNS.has(cleanWord) || (cleanWord.endsWith('tion') && cleanWord.length > 5) || (cleanWord.endsWith('ism') && cleanWord.length > 5)) {
    return {
      word: rawWord,
      cleanWord,
      pos: 'noun',
      definition: `A entity, state, or concept representing ${cleanWord}.`,
      isTechnical: false,
    };
  }

  return null;
}

export function parsePassageToTokens(passage: string): Token[] {
  const tokens: Token[] = [];
  // Match whitespace/punctuation boundaries vs word tokens
  const regex = /([a-zA-Z0-9'-]+)|([^a-zA-Z0-9'-]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(passage)) !== null) {
    const [fullMatch, wordMatch, textMatch] = match;
    if (wordMatch) {
      const analysis = analyzeWord(wordMatch);
      if (analysis) {
        tokens.push({ type: 'word', text: wordMatch, analysis });
      } else {
        tokens.push({ type: 'text', text: wordMatch });
      }
    } else if (textMatch) {
      tokens.push({ type: 'text', text: textMatch });
    }
  }

  return tokens;
}

export function loadLocalJar(): VocabularyItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_JAR_KEY);
    return stored ? (JSON.parse(stored) as VocabularyItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalJar(jar: VocabularyItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_JAR_KEY, JSON.stringify(jar));
  } catch {
    // ignore
  }
}

export function loadLocalVocabSettings(): VocabularySettings {
  if (typeof window === 'undefined') return DEFAULT_VOCAB_SETTINGS;
  try {
    const stored = localStorage.getItem(LOCAL_VOCAB_SETTINGS_KEY);
    return stored ? (JSON.parse(stored) as VocabularySettings) : DEFAULT_VOCAB_SETTINGS;
  } catch {
    return DEFAULT_VOCAB_SETTINGS;
  }
}

export function saveLocalVocabSettings(settings: VocabularySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_VOCAB_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
