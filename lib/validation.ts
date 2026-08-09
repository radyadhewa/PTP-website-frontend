import {
  DIFFICULTIES,
  GENRES,
  PASSAGE_LENGTHS,
  type Preferences,
  type ProfilePatch,
  type WritingDraft,
} from '@/types/domain';
import type { AuthPayload, SignupPayload } from '@/types/api';
import { ApiError } from '@/lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_LOGIN_PASSWORD_LENGTH = 1_024;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;
const MAX_WRITING_SECTION_LENGTH = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function parseBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }
  return body;
}

function parseEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'A valid email address is required.');
  }

  const email = value.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'A valid email address is required.');
  }
  return email;
}

function parseLoginPassword(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_LOGIN_PASSWORD_LENGTH) {
    throw new ApiError(400, 'Email and password are required.');
  }
  return value;
}

export function parseAuthPayload(body: unknown): AuthPayload {
  const value = parseBody(body);
  if (!hasOnlyKeys(value, ['email', 'password'])) {
    throw new ApiError(400, 'Invalid login payload.');
  }
  return {
    email: parseEmail(value.email),
    password: parseLoginPassword(value.password),
  };
}

export function parseSignupPayload(body: unknown): SignupPayload {
  const value = parseBody(body);
  if (!hasOnlyKeys(value, ['email', 'password', 'confirmPassword'])) {
    throw new ApiError(400, 'Invalid signup payload.');
  }

  const email = parseEmail(value.email);
  if (
    typeof value.password !== 'string' ||
    value.password.length < MIN_PASSWORD_LENGTH ||
    value.password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new ApiError(400, 'Password must be between 8 and 128 characters.');
  }
  if (typeof value.confirmPassword !== 'string') {
    throw new ApiError(400, 'Password confirmation is required.');
  }
  if (value.password !== value.confirmPassword) {
    throw new ApiError(400, 'Passwords do not match.');
  }

  return { email, password: value.password, confirmPassword: value.confirmPassword };
}

function parsePreferences(value: unknown): Preferences | null {
  if (value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['genres', 'difficulty', 'passageLength', 'completedAt'])
  ) {
    throw new ApiError(400, 'Invalid preferences.');
  }
  if (
    !Array.isArray(value.genres) ||
    value.genres.length === 0 ||
    value.genres.length > GENRES.length ||
    !value.genres.every(
      (genre): genre is Preferences['genres'][number] =>
        typeof genre === 'string' && GENRES.includes(genre as Preferences['genres'][number]),
    ) ||
    new Set(value.genres).size !== value.genres.length
  ) {
    throw new ApiError(400, 'Invalid preference genres.');
  }
  if (
    typeof value.difficulty !== 'string' ||
    !DIFFICULTIES.includes(value.difficulty as Preferences['difficulty']) ||
    typeof value.passageLength !== 'string' ||
    !PASSAGE_LENGTHS.includes(value.passageLength as Preferences['passageLength']) ||
    typeof value.completedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.completedAt))
  ) {
    throw new ApiError(400, 'Invalid preferences.');
  }

  return {
    genres: [...value.genres],
    difficulty: value.difficulty as Preferences['difficulty'],
    passageLength: value.passageLength as Preferences['passageLength'],
    completedAt: value.completedAt,
  };
}

function parseWritingDraft(value: unknown): WritingDraft {
  if (!isRecord(value) || !hasOnlyKeys(value, ['introduction', 'body', 'conclusion'])) {
    throw new ApiError(400, 'Invalid writing draft.');
  }

  for (const section of ['introduction', 'body', 'conclusion'] as const) {
    if (typeof value[section] !== 'string' || value[section].length > MAX_WRITING_SECTION_LENGTH) {
      throw new ApiError(400, 'Invalid writing draft.');
    }
  }

  return {
    introduction: value.introduction as string,
    body: value.body as string,
    conclusion: value.conclusion as string,
  };
}

export function parseProfilePatch(body: unknown): ProfilePatch {
  const value = parseBody(body);
  if (typeof value.action !== 'string') {
    throw new ApiError(400, 'A profile action is required.');
  }

  switch (value.action) {
    case 'updatePreferences':
      if (!hasOnlyKeys(value, ['action', 'preferences'])) {
        throw new ApiError(400, 'Invalid updatePreferences payload.');
      }
      return { action: value.action, preferences: parsePreferences(value.preferences) };
    case 'updateWriting':
      if (!hasOnlyKeys(value, ['action', 'writingDraft'])) {
        throw new ApiError(400, 'Invalid updateWriting payload.');
      }
      return { action: value.action, writingDraft: parseWritingDraft(value.writingDraft) };
    case 'markRead':
    case 'resetProgress':
      if (!hasOnlyKeys(value, ['action'])) {
        throw new ApiError(400, `Invalid ${value.action} payload.`);
      }
      return { action: value.action };
    default:
      throw new ApiError(400, 'Unknown profile action.');
  }
}
