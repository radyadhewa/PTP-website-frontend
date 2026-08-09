import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/types/domain';

type DataStoreModule = typeof import('@/lib/dataStore');

const originalCwd = process.cwd();
let temporaryCwd = '';

function dataFile(): string {
  return path.join(temporaryCwd, 'data', 'app-data.json');
}

function user(email: string): UserProfile {
  return {
    email,
    passwordHash: 'stored-password-hash',
    createdAt: '2026-01-01T00:00:00.000Z',
    preferences: null,
    readingData: {
      currentStreak: 0,
      bestStreak: 0,
      totalBooksRead: 0,
      lastReadDate: null,
    },
    writingDraft: { introduction: '', body: '', conclusion: '' },
  };
}

function sessionKey(token: string): string {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

async function importDataStore(): Promise<DataStoreModule> {
  return import('@/lib/dataStore');
}

async function writeStore(store: unknown): Promise<void> {
  await mkdir(path.dirname(dataFile()), { recursive: true });
  await writeFile(dataFile(), JSON.stringify(store), 'utf8');
}

beforeEach(async () => {
  vi.resetModules();
  temporaryCwd = await mkdtemp(path.join(tmpdir(), 'ptp-data-store-'));
  process.chdir(temporaryCwd);
});

afterEach(async () => {
  process.chdir(originalCwd);
  vi.useRealTimers();
  vi.resetModules();
  await rm(temporaryCwd, { recursive: true, force: true });
});

describe('data store initialization and users', () => {
  it('initializes an empty store inside the isolated working directory', async () => {
    const store = await importDataStore();

    await expect(store.findUserByEmail('missing@example.com')).resolves.toBeNull();
    await expect(readFile(dataFile(), 'utf8').then(JSON.parse)).resolves.toEqual({
      users: [],
      sessions: {},
    });
  });

  it('creates, finds, rejects duplicate, updates, and misses users', async () => {
    const store = await importDataStore();
    const original = user('reader@example.com');

    await expect(store.createUser(original)).resolves.toEqual(original);
    await expect(store.createUser({ ...original, passwordHash: 'different' })).resolves.toBeNull();
    await expect(store.findUserByEmail(original.email)).resolves.toEqual(original);
    await expect(store.findUserByEmail('absent@example.com')).resolves.toBeNull();

    await expect(
      store.updateUser(original.email, (current) => ({
        ...current,
        readingData: { ...current.readingData, totalBooksRead: 4 },
      })),
    ).resolves.toMatchObject({ readingData: { totalBooksRead: 4 } });
    await expect(store.updateUser(original.email, (current) => current)).resolves.toMatchObject({
      email: original.email,
    });
    await expect(store.updateUser('absent@example.com', () => original)).resolves.toBeNull();

    const persisted = JSON.parse(await readFile(dataFile(), 'utf8')) as { users: UserProfile[] };
    expect(persisted.users).toHaveLength(1);
    expect(persisted.users[0].readingData.totalBooksRead).toBe(4);
  });

  it('serializes concurrent mutations and leaves only a complete atomic store file', async () => {
    const store = await importDataStore();
    await store.createUser(user('seed@example.com'));

    const emails = Array.from({ length: 16 }, (_, index) => `reader-${index}@example.com`);
    const duplicate = user('duplicate@example.com');
    const results = await Promise.all([
      ...emails.map((email) => store.createUser(user(email))),
      store.createUser(duplicate),
      store.createUser(duplicate),
    ]);
    expect(results.filter((result) => result?.email === duplicate.email)).toHaveLength(1);

    const persisted = JSON.parse(await readFile(dataFile(), 'utf8')) as { users: UserProfile[] };
    expect(persisted.users).toHaveLength(18);
    expect(new Set(persisted.users.map(({ email }) => email)).size).toBe(18);
    await expect(readdir(path.dirname(dataFile()))).resolves.toEqual(['app-data.json']);
  });

  it('continues processing queued mutations after an updater rejects', async () => {
    const store = await importDataStore();
    await store.createUser(user('reader@example.com'));

    await expect(
      store.updateUser('reader@example.com', () => {
        throw new Error('updater failed');
      }),
    ).rejects.toThrow('updater failed');
    await expect(store.createUser(user('next@example.com'))).resolves.toMatchObject({
      email: 'next@example.com',
    });
  });
});

describe('data store sessions', () => {
  it('creates hashed sessions, retrieves them, and deletes them', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T12:00:00.000Z'));
    const store = await importDataStore();
    const token = 'private-session-token';

    await store.createSession(token, 'reader@example.com');
    const onDisk = await readFile(dataFile(), 'utf8');
    expect(onDisk).not.toContain(token);
    expect(JSON.parse(onDisk).sessions).toEqual({
      [sessionKey(token)]: {
        email: 'reader@example.com',
        createdAt: '2026-03-01T12:00:00.000Z',
        expiresAt: '2026-03-08T12:00:00.000Z',
      },
    });
    await expect(store.getSession(token)).resolves.toEqual({
      email: 'reader@example.com',
      createdAt: '2026-03-01T12:00:00.000Z',
      expiresAt: '2026-03-08T12:00:00.000Z',
    });
    await expect(store.getSession('unknown-token')).resolves.toBeNull();

    await store.deleteSession(token);
    await store.deleteSession(token);
    await expect(store.getSession(token)).resolves.toBeNull();
  });

  it('migrates a legacy plain-token session and derives its expiration', async () => {
    const token = 'legacy-plain-token';
    await writeStore({
      users: [],
      sessions: {
        [token]: { email: 'legacy@example.com', createdAt: '2026-04-01T00:00:00.000Z' },
      },
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T00:00:00.000Z'));
    const store = await importDataStore();

    await expect(store.getSession(token)).resolves.toEqual({
      email: 'legacy@example.com',
      createdAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-04-08T00:00:00.000Z',
    });

    const persisted = JSON.parse(await readFile(dataFile(), 'utf8')) as {
      sessions: Record<string, unknown>;
    };
    expect(persisted.sessions[token]).toBeUndefined();
    expect(persisted.sessions[sessionKey(token)]).toEqual({
      email: 'legacy@example.com',
      createdAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-04-08T00:00:00.000Z',
    });
  });

  it('removes expired sessions from disk', async () => {
    const token = 'expired-token';
    await writeStore({
      users: [],
      sessions: {
        [sessionKey(token)]: {
          email: 'reader@example.com',
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    const store = await importDataStore();

    await expect(store.getSession(token)).resolves.toBeNull();
    await expect(readFile(dataFile(), 'utf8').then(JSON.parse)).resolves.toEqual({
      users: [],
      sessions: {},
    });
  });

  it('deletes both legacy and hashed forms of a token', async () => {
    const token = 'token-with-two-records';
    const storedSession = {
      email: 'reader@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-08T00:00:00.000Z',
    };
    await writeStore({
      users: [],
      sessions: { [token]: storedSession, [sessionKey(token)]: storedSession },
    });
    const store = await importDataStore();

    await store.deleteSession(token);
    expect(JSON.parse(await readFile(dataFile(), 'utf8')).sessions).toEqual({});
  });
});

describe('data store validation', () => {
  it.each([
    ['non-object root', []],
    ['missing sessions', { users: [] }],
    ['non-array users', { users: {}, sessions: {} }],
    ['invalid user', { users: [{ email: '' }], sessions: {} }],
    [
      'invalid preferences',
      {
        users: [
          {
            ...user('reader@example.com'),
            preferences: {
              genres: ['Unknown'],
              difficulty: 'Impossible',
              passageLength: 'huge',
              completedAt: 'not-a-date',
            },
          },
        ],
        sessions: {},
      },
    ],
    ['invalid sessions collection', { users: [], sessions: [] }],
    [
      'invalid session',
      { users: [], sessions: { token: { email: '', createdAt: 'not-a-date' } } },
    ],
  ])('rejects a store with %s', async (_label, invalidStore) => {
    await writeStore(invalidStore);
    const store = await importDataStore();

    await expect(store.findUserByEmail('reader@example.com')).rejects.toThrow(
      'The application data store has an invalid shape.',
    );
  });

  it('rejects malformed JSON instead of replacing private data', async () => {
    await mkdir(path.dirname(dataFile()), { recursive: true });
    await writeFile(dataFile(), '{not valid json', 'utf8');
    const store = await importDataStore();

    await expect(store.findUserByEmail('reader@example.com')).rejects.toBeInstanceOf(SyntaxError);
    await expect(readFile(dataFile(), 'utf8')).resolves.toBe('{not valid json');
  });
});
