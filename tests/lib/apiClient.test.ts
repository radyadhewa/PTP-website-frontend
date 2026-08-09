import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, auth, errorMessage, getProfile, updateWriting } from '@/services/apiClient';
import type { PublicProfile } from '@/types/domain';

const profile: PublicProfile = {
  email: 'reader@example.com',
  preferences: null,
  readingData: { currentStreak: 1, bestStreak: 2, totalBooksRead: 3, lastReadDate: null },
  writingDraft: { introduction: '', body: '', conclusion: '' },
  passages: [],
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('api client errors and requests', () => {
  it('serializes authentication payloads and returns valid account responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ email: 'reader@example.com' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      auth('login', { email: 'reader@example.com', password: 'password' }),
    ).resolves.toEqual({
      email: 'reader@example.com',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'reader@example.com', password: 'password' }),
      }),
    );
  });

  it('exposes server errors safely with status and request ID', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ error: 'Access denied', requestId: 'req-123' }, 403)),
    );

    await expect(
      auth('login', { email: 'reader@example.com', password: 'password' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Access denied',
      status: 403,
      requestId: 'req-123',
      aborted: false,
    });
  });

  it('turns invalid JSON and network failures into safe ApiErrors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{invalid', { status: 200 })));
    await expect(
      auth('login', { email: 'reader@example.com', password: 'password' }),
    ).rejects.toMatchObject({
      message: 'The server returned an invalid response.',
      status: 200,
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(
      auth('login', { email: 'reader@example.com', password: 'password' }),
    ).rejects.toMatchObject({
      message: 'Unable to reach the server. Check your connection and try again.',
      status: 0,
    });
  });

  it('uses the fallback only for non-ApiError values', () => {
    expect(errorMessage(new Error('unexpected'), 'Try again.')).toBe('Try again.');
    expect(errorMessage(new ApiError('Known issue'), 'Try again.')).toBe('Known issue');
  });
});

describe('getProfile retry policy', () => {
  it('retries one transient 503 response before returning a valid profile', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'Temporarily unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse(profile));
    vi.stubGlobal('fetch', fetchMock);

    const request = getProfile();
    await vi.runAllTimersAsync();

    await expect(request).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/me',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('stops a pending retry when its signal is aborted', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'Temporarily unavailable' }, 503));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const request = getProfile(controller.signal);
    await Promise.resolve();
    await Promise.resolve();
    controller.abort('navigation');

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Request cancelled.',
      aborted: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry mutation requests after a transient failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'Temporarily unavailable' }, 503));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      updateWriting({ introduction: '', body: '', conclusion: '' }),
    ).rejects.toMatchObject({
      status: 503,
      message: 'Temporarily unavailable',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/me', expect.objectContaining({ method: 'PATCH' }));
  });
});
