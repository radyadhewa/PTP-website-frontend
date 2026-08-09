import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';

function mocks(method?: string) {
  return createMocks<NextApiRequest, NextApiResponse>({ method });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('assertMethod', () => {
  it('accepts an allowed request method', () => {
    const { req, res } = mocks('POST');

    expect(() => assertMethod(req, res, ['GET', 'POST'])).not.toThrow();
    expect(res.getHeader('Allow')).toBeUndefined();
  });

  it.each([undefined, 'DELETE'])('rejects unsupported method %s with an Allow header', (method) => {
    const { req, res } = mocks(method);
    if (method === undefined) {
      req.method = undefined;
    }

    expect(() => assertMethod(req, res, ['GET', 'POST'])).toThrowError(
      expect.objectContaining({
        name: 'ApiError',
        statusCode: 405,
        message: 'Method not allowed.',
      }),
    );
    expect(res.getHeader('Allow')).toEqual(['GET', 'POST']);
  });
});

describe('withApiHandler', () => {
  it('sets no-store and request ID headers before invoking a successful handler', async () => {
    const { req, res } = mocks('GET');
    const handler: NextApiHandler = vi.fn((_req, response) => {
      expect(response.getHeader('Cache-Control')).toBe('no-store');
      expect(response.getHeader('X-Request-Id')).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      response.status(200).json({ ok: true });
    });

    await withApiHandler(handler)(req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });

  it('returns an ApiError status and safe payload with the same request ID', async () => {
    const { req, res } = mocks('PATCH');
    const handler: NextApiHandler = async () => {
      throw new ApiError(422, 'Invalid request.');
    };

    await withApiHandler(handler)(req, res);

    const requestId = res.getHeader('X-Request-Id');
    expect(res.statusCode).toBe(422);
    expect(res._getJSONData()).toEqual({ error: 'Invalid request.', requestId });
  });

  it('logs generic failures and returns a sanitized 500 response', async () => {
    const failure = new Error('database password must remain private');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { req, res } = mocks('GET');

    await withApiHandler(async () => {
      throw failure;
    })(req, res);

    const requestId = res.getHeader('X-Request-Id');
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Internal server error.', requestId });
    expect(res._getData()).not.toContain(failure.message);
    expect(consoleError).toHaveBeenCalledWith(`[${requestId}] Unhandled API error.`, failure);
  });

  it('does not write another response after headers have been sent', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { req, res } = mocks('GET');

    await withApiHandler(async (_request, response) => {
      response.status(202).end('already sent');
      throw new Error('late failure');
    })(req, res);

    const requestId = res.getHeader('X-Request-Id');
    expect(res.statusCode).toBe(202);
    expect(res._getData()).toBe('already sent');
    expect(consoleError).toHaveBeenCalledWith(
      `[${requestId}] API request failed after headers were sent.`,
    );
  });
});
