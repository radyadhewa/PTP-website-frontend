import { randomBytes } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UserProfile } from '@/types/domain';
import { createSession, deleteSession, findUserByEmail, getSession } from '@/lib/dataStore';

const SESSION_COOKIE_NAME = 'reading_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const cookieName = part.slice(0, separatorIndex).trim();
    if (cookieName !== name) {
      continue;
    }
    try {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function getSessionToken(req: NextApiRequest): string | null {
  const token = getCookie(req.headers.cookie, SESSION_COOKIE_NAME);
  return token && token.length <= 256 ? token : null;
}

function cookieAttributes(): string {
  return `Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function startSession(email: string, res: NextApiResponse): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  await createSession(token, email);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes()}; Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  );
}

export async function endSession(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const token = getSessionToken(req);
  if (token) {
    await deleteSession(token);
  }
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; ${cookieAttributes()}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
}

export async function getAuthenticatedUser(req: NextApiRequest): Promise<UserProfile | null> {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }
  const session = await getSession(token);
  if (!session) {
    return null;
  }
  return findUserByEmail(session.email);
}
