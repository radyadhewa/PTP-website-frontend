import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import adminLoginHandler from '@/pages/api/admin/login';
import adminLogoutHandler from '@/pages/api/admin/logout';
import adminMeHandler from '@/pages/api/admin/me';
import adminBooksHandler from '@/pages/api/admin/books';
import parsePdfHandler from '@/pages/api/admin/parse-pdf';
import * as dataStore from '@/lib/dataStore';
import * as session from '@/lib/session';

function mocks(method?: string) {
  return createMocks<NextApiRequest, NextApiResponse>({ method });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Admin Authentication Endpoints', () => {
  it('authenticates valid admin credentials and sets session cookie', async () => {
    vi.spyOn(session, 'startAdminSession').mockImplementation(async (_u, res) => {
      res.setHeader('Set-Cookie', 'admin_session=testtoken');
    });

    const { req, res } = mocks('POST');
    req.body = {
      username: 'admin',
      password: 'admin123',
    };

    await adminLoginHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ authenticated: true, username: 'admin' });
    expect(res.getHeader('Set-Cookie')).toBeDefined();
  });

  it('rejects invalid admin credentials with 401', async () => {
    const { req, res } = mocks('POST');
    req.body = {
      username: 'admin',
      password: 'wrongpassword',
    };

    await adminLoginHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        error: 'Invalid admin username or password.',
      }),
    );
  });

  it('handles admin logout and clears session', async () => {
    vi.spyOn(session, 'endAdminSession').mockImplementation(async (_req, res) => {
      res.setHeader('Set-Cookie', 'admin_session=; Max-Age=0');
    });

    const { req, res } = mocks('POST');
    await adminLogoutHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });

  it('returns admin profile for authenticated admin session', async () => {
    vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue({ username: 'admin' });

    const { req, res } = mocks('GET');
    await adminMeHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ authenticated: true, username: 'admin' });
  });

  it('rejects unauthenticated admin session request', async () => {
    vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue(null);

    const { req, res } = mocks('GET');
    await adminMeHandler(req, res);

    expect(res.statusCode).toBe(401);
  });
});

describe('Admin Curated Books Endpoints', () => {
  it('rejects unauthenticated book requests', async () => {
    vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue(null);

    const { req, res } = mocks('GET');
    await adminBooksHandler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it('lists curated books for authenticated admin', async () => {
    vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue({ username: 'admin' });
    vi.spyOn(dataStore, 'getCuratedBooks').mockResolvedValue([
      {
        id: '1',
        title: 'Curated Title',
        author: 'Author Name',
        text: 'Text content here',
        genre: 'Science & Technology',
        difficulty: 'Beginner',
        length: 'short',
        createdAt: new Date().toISOString(),
      },
    ]);

    const { req, res } = mocks('GET');
    await adminBooksHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveLength(1);
    expect(res._getJSONData()[0].title).toBe('Curated Title');
  });

  it('adds a curated book for authenticated admin', async () => {
    vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue({ username: 'admin' });
    vi.spyOn(dataStore, 'addCuratedBook').mockImplementation(async (input) => ({
      ...input,
      id: 'generated-id',
      createdAt: new Date().toISOString(),
    }));

    const { req, res } = mocks('POST');
    req.body = {
      title: 'New Book',
      author: 'Author',
      text: 'Passage text content here...',
      genre: 'Health & Wellness',
      difficulty: 'Intermediate',
      length: 'medium',
    };

    await adminBooksHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData().id).toBe('generated-id');
    expect(res._getJSONData().title).toBe('New Book');
  });

  it('deletes a curated book for authenticated admin', async () => {
    vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue({ username: 'admin' });
    vi.spyOn(dataStore, 'deleteCuratedBook').mockResolvedValue(true);

    const { req, res } = mocks('DELETE');
    req.query = { id: 'book-id-123' };

    await adminBooksHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });

  describe('Admin PDF Parsing Endpoint', () => {
    it('rejects unauthorized requests with 401', async () => {
      vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue(null);
      const { req, res } = mocks('POST');
      req.body = { fileBase64: 'test' };

      await parsePdfHandler(req, res);

      expect(res.statusCode).toBe(401);
    });

    it('rejects missing fileBase64 payload with 400', async () => {
      vi.spyOn(session, 'getAuthenticatedAdmin').mockResolvedValue({ username: 'admin' });
      const { req, res } = mocks('POST');
      req.body = {};

      await parsePdfHandler(req, res);

      expect(res.statusCode).toBe(400);
    });
  });
});
