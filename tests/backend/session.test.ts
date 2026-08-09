import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dataStore = vi.hoisted(() => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  findUserByEmail: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/dataStore', () => dataStore);

import {
  endSession,
  getAuthenticatedUser,
  getSessionToken,
  SESSION_MAX_AGE_SECONDS,
  startSession,
} from '@/lib/session';

const originalNodeEnv = process.env.NODE_ENV;

function request(cookie?: string): NextApiRequest {
  return { headers: cookie === undefined ? {} : { cookie } } as NextApiRequest;
}

function response(): NextApiResponse {
  return { setHeader: vi.fn() } as unknown as NextApiResponse;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = originalNodeEnv;
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe('session cookie parsing', () => {
  it('extracts and decodes the named cookie while preserving equals signs', () => {
    expect(getSessionToken(request('theme=dark; reading_session=token%3Dpart; other=value'))).toBe(
      'token=part',
    );
  });

  it('rejects missing, malformed, empty, and oversized session cookies', () => {
    expect(getSessionToken(request())).toBeNull();
    expect(getSessionToken(request('theme=dark; flag; other=value'))).toBeNull();
    expect(getSessionToken(request('reading_session=%E0%A4%A'))).toBeNull();
    expect(getSessionToken(request('reading_session='))).toBeNull();
    expect(getSessionToken(request(`reading_session=${'x'.repeat(257)}`))).toBeNull();
  });
});

describe('session lifecycle', () => {
  it('creates a random session and serializes a development cookie safely', async () => {
    const res = response();

    await startSession('reader@example.com', res);

    expect(dataStore.createSession).toHaveBeenCalledOnce();
    const [token, email] = dataStore.createSession.mock.calls[0] as [string, string];
    expect(token).toMatch(/^[A-Za-z\d_-]{43}$/);
    expect(email).toBe('reader@example.com');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      `reading_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    );
  });

  it('adds Secure to production cookies', async () => {
    process.env.NODE_ENV = 'production';
    const res = response();

    await startSession('reader@example.com', res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800'),
    );
  });

  it('deletes a valid server session and expires its browser cookie', async () => {
    const res = response();

    await endSession(request('reading_session=session-token'), res);

    expect(dataStore.deleteSession).toHaveBeenCalledWith('session-token');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      'reading_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    );
  });

  it('expires the browser cookie without a datastore call when no token exists', async () => {
    const res = response();

    await endSession(request(), res);

    expect(dataStore.deleteSession).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledOnce();
  });
});

describe('authenticated user lookup', () => {
  it('returns null without a cookie or active session', async () => {
    await expect(getAuthenticatedUser(request())).resolves.toBeNull();
    expect(dataStore.getSession).not.toHaveBeenCalled();

    dataStore.getSession.mockResolvedValueOnce(null);
    await expect(
      getAuthenticatedUser(request('reading_session=expired-token')),
    ).resolves.toBeNull();
    expect(dataStore.getSession).toHaveBeenCalledWith('expired-token');
    expect(dataStore.findUserByEmail).not.toHaveBeenCalled();
  });

  it('finds the user associated with an active session', async () => {
    const profile = { email: 'reader@example.com' };
    dataStore.getSession.mockResolvedValueOnce({
      email: profile.email,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-08T00:00:00.000Z',
    });
    dataStore.findUserByEmail.mockResolvedValueOnce(profile);

    await expect(
      getAuthenticatedUser(request('reading_session=active-token')),
    ).resolves.toBe(profile);
    expect(dataStore.findUserByEmail).toHaveBeenCalledWith(profile.email);
  });
});
