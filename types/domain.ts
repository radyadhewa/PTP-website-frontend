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

export interface UserProfile {
  email: string;
  passwordHash: string;
  createdAt: string;
  preferences: Preferences | null;
  readingData: ReadingData;
  writingDraft: WritingDraft;
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
}

export type ProfilePatch =
  | { action: 'updatePreferences'; preferences: Preferences | null }
  | { action: 'updateWriting'; writingDraft: WritingDraft }
  | { action: 'markRead' }
  | { action: 'resetProgress' };
