export const GENRES = [
  'Science & Technology',
  'Nature & Environment',
  'History & Culture',
  'Self-Improvement',
  'Fiction & Literature',
  'Health & Wellness',
] as const;

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const PASSAGE_LENGTHS = ['short', 'medium', 'long'] as const;

export type Genre = (typeof GENRES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type PassageLength = (typeof PASSAGE_LENGTHS)[number];

export interface Preferences {
  genres: Genre[];
  difficulty: Difficulty;
  passageLength: PassageLength;
  completedAt: string;
}

export interface Passage {
  text: string;
  genre: Genre;
  difficulty: Difficulty;
  length: PassageLength;
}

export interface ReadingData {
  currentStreak: number;
  bestStreak: number;
  totalBooksRead: number;
  lastReadDate: string | null;
}

export interface WritingDraft {
  introduction: string;
  body: string;
  conclusion: string;
}

export interface WritingFeedback {
  weakPoints: string[];
  strengths: string[];
  suggestions: string[];
}

export type POSType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'technical';

export interface VocabularyItem {
  id: string;
  word: string;
  pos: POSType;
  definition: string;
  dateAdded: string;
  note?: string;
  learned?: boolean;
}

export interface VocabularySettings {
  highlightEnabled: boolean;
  highlightPOS: POSType[];
  includeUnknown: boolean;
  autoAdd: boolean;
}

export const DEFAULT_VOCAB_SETTINGS: VocabularySettings = {
  highlightEnabled: true,
  highlightPOS: ['noun', 'verb', 'adjective', 'adverb', 'technical'],
  includeUnknown: true,
  autoAdd: false,
};

export interface UserProfile {
  email: string;
  passwordHash: string;
  createdAt: string;
  preferences: Preferences | null;
  readingData: ReadingData;
  writingDraft: WritingDraft;
  jar?: VocabularyItem[];
  vocabSettings?: VocabularySettings;
}

export interface Session {
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface AppStore {
  users: UserProfile[];
  sessions: Record<string, Session>;
}

export interface PublicProfile {
  email: string;
  preferences: Preferences | null;
  readingData: ReadingData;
  writingDraft: WritingDraft;
  passages: Passage[];
  jar?: VocabularyItem[];
  vocabSettings?: VocabularySettings;
}

export type ProfilePatch =
  | { action: 'updatePreferences'; preferences: Preferences | null }
  | { action: 'updateWriting'; writingDraft: WritingDraft }
  | { action: 'markRead' }
  | { action: 'resetProgress' }
  | { action: 'updateJar'; jar: VocabularyItem[] }
  | { action: 'updateVocabSettings'; vocabSettings: VocabularySettings };
