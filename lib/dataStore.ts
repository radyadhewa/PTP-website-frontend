import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'fs/promises';
import path from 'path';
import type { Session, UserProfile } from '@/types/domain';
import { DIFFICULTIES, GENRES, PASSAGE_LENGTHS } from '@/types/domain';

interface StoredSession {
  email: string;
  createdAt: string;
  expiresAt?: string;
}

interface StoredAppStore {
  users: UserProfile[];
  sessions: Record<string, StoredSession>;
}

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'app-data.json');
const SESSION_KEY_PREFIX = 'sha256:';
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000;

let mutationQueue: Promise<void> = Promise.resolve();
let initializationPromise: Promise<void> | null = null;

function emptyStore(): StoredAppStore {
  return { users: [], sessions: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isValidPreferences(value: unknown): boolean {
  if (value === null) {
    return true;
  }
  if (!isRecord(value)) {
    return false;
  }
  return (
    Array.isArray(value.genres) &&
    value.genres.length > 0 &&
    value.genres.every(
      (genre) => typeof genre === 'string' && GENRES.includes(genre as (typeof GENRES)[number]),
    ) &&
    typeof value.difficulty === 'string' &&
    DIFFICULTIES.includes(value.difficulty as (typeof DIFFICULTIES)[number]) &&
    typeof value.passageLength === 'string' &&
    PASSAGE_LENGTHS.includes(value.passageLength as (typeof PASSAGE_LENGTHS)[number]) &&
    isValidDateString(value.completedAt)
  );
}

function isValidUser(value: unknown): value is UserProfile {
  if (!isRecord(value) || !isRecord(value.readingData) || !isRecord(value.writingDraft)) {
    return false;
  }

  const { readingData, writingDraft } = value;
  return (
    typeof value.email === 'string' &&
    value.email.length > 0 &&
    typeof value.passwordHash === 'string' &&
    value.passwordHash.length > 0 &&
    isValidDateString(value.createdAt) &&
    isValidPreferences(value.preferences) &&
    isNonNegativeInteger(readingData.currentStreak) &&
    isNonNegativeInteger(readingData.bestStreak) &&
    isNonNegativeInteger(readingData.totalBooksRead) &&
    (readingData.lastReadDate === null || isValidDateString(readingData.lastReadDate)) &&
    typeof writingDraft.introduction === 'string' &&
    typeof writingDraft.body === 'string' &&
    typeof writingDraft.conclusion === 'string'
  );
}

function isValidStoredSession(value: unknown): value is StoredSession {
  return (
    isRecord(value) &&
    typeof value.email === 'string' &&
    value.email.length > 0 &&
    isValidDateString(value.createdAt) &&
    (value.expiresAt === undefined || isValidDateString(value.expiresAt))
  );
}

function isValidSessions(value: unknown): value is Record<string, StoredSession> {
  return (
    isRecord(value) &&
    Object.entries(value).every(([key, session]) => key.length > 0 && isValidStoredSession(session))
  );
}

function parseStore(raw: string): StoredAppStore {
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    !Array.isArray(value.users) ||
    !value.users.every(isValidUser) ||
    !isValidSessions(value.sessions)
  ) {
    throw new Error('The application data store has an invalid shape.');
  }
  return {
    users: value.users,
    sessions: value.sessions,
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

async function writeStoreAtomically(store: StoredAppStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  const temporaryFile = path.join(dataDir, `.app-data.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporaryFile, JSON.stringify(store, null, 2), 'utf8');
    await rename(temporaryFile, dataFile);
  } catch (error: unknown) {
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

async function ensureStoreExists(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, 'utf8');
    return;
  } catch (error: unknown) {
    if (!isNodeError(error) || error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (!initializationPromise) {
    initializationPromise = writeStoreAtomically(emptyStore());
  }
  await initializationPromise;
}

async function readStoreFromDisk(): Promise<StoredAppStore> {
  await ensureStoreExists();
  return parseStore(await readFile(dataFile, 'utf8'));
}

function enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(mutation, mutation);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readAfterMutations(): Promise<StoredAppStore> {
  await mutationQueue;
  return readStoreFromDisk();
}

function hashSessionToken(token: string): string {
  return `${SESSION_KEY_PREFIX}${createHash('sha256').update(token).digest('hex')}`;
}

function sessionExpiry(session: StoredSession): Date {
  return new Date(session.expiresAt ?? Date.parse(session.createdAt) + SESSION_LIFETIME_MS);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const store = await readAfterMutations();
  return store.users.find((user) => user.email === email) ?? null;
}

export function createUser(user: UserProfile): Promise<UserProfile | null> {
  return enqueueMutation(async () => {
    const store = await readStoreFromDisk();
    if (store.users.some((existingUser) => existingUser.email === user.email)) {
      return null;
    }
    store.users.push(user);
    await writeStoreAtomically(store);
    return user;
  });
}

export function updateUser(
  email: string,
  updater: (user: UserProfile) => UserProfile,
): Promise<UserProfile | null> {
  return enqueueMutation(async () => {
    const store = await readStoreFromDisk();
    const index = store.users.findIndex((user) => user.email === email);
    if (index === -1) {
      return null;
    }

    const currentUser = store.users[index];
    const nextUser = updater(currentUser);
    if (nextUser !== currentUser) {
      store.users[index] = nextUser;
      await writeStoreAtomically(store);
    }
    return nextUser;
  });
}

export function createSession(token: string, email: string): Promise<void> {
  return enqueueMutation(async () => {
    const store = await readStoreFromDisk();
    const createdAt = new Date();
    store.sessions[hashSessionToken(token)] = {
      email,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + SESSION_LIFETIME_MS).toISOString(),
    };
    await writeStoreAtomically(store);
  });
}

export function getSession(token: string): Promise<Session | null> {
  return enqueueMutation(async () => {
    const store = await readStoreFromDisk();
    const hashedKey = hashSessionToken(token);
    const storedKey = store.sessions[hashedKey] ? hashedKey : token;
    const storedSession = store.sessions[storedKey];
    if (!storedSession) {
      return null;
    }

    const expiresAt = sessionExpiry(storedSession);
    if (expiresAt.getTime() <= Date.now()) {
      delete store.sessions[storedKey];
      await writeStoreAtomically(store);
      return null;
    }

    const session: Session = {
      email: storedSession.email,
      createdAt: storedSession.createdAt,
      expiresAt: expiresAt.toISOString(),
    };
    if (storedKey !== hashedKey || !storedSession.expiresAt) {
      delete store.sessions[storedKey];
      store.sessions[hashedKey] = session;
      await writeStoreAtomically(store);
    }
    return session;
  });
}

export function deleteSession(token: string): Promise<void> {
  return enqueueMutation(async () => {
    const store = await readStoreFromDisk();
    const hashedKey = hashSessionToken(token);
    const changed = Boolean(store.sessions[hashedKey] || store.sessions[token]);
    delete store.sessions[hashedKey];
    delete store.sessions[token];
    if (changed) {
      await writeStoreAtomically(store);
    }
  });
}
