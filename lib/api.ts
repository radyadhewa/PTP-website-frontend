import { randomUUID } from 'crypto';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type { ApiErrorPayload } from '@/types/api';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function assertMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: readonly string[],
): void {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    throw new ApiError(405, 'Method not allowed.');
  }
}

export function withApiHandler(handler: NextApiHandler): NextApiHandler {
  return async (req, res): Promise<void> => {
    const requestId = randomUUID();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Request-Id', requestId);

    try {
      await handler(req, res);
    } catch (error: unknown) {
      if (res.headersSent || res.writableEnded) {
        console.error(`[${requestId}] API request failed after headers were sent.`);
        return;
      }

      const statusCode = error instanceof ApiError ? error.statusCode : 500;
      const message = error instanceof ApiError ? error.message : 'Internal server error.';

      if (!(error instanceof ApiError)) {
        console.error(`[${requestId}] Unhandled API error.`, error);
      }

      const payload: ApiErrorPayload = { error: message, requestId };
      res.status(statusCode).json(payload);
    }
  };
}
