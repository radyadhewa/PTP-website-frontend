import { filterPassagesByPreferences } from '@/lib/passages';
import { getSession, findUserByEmail, updateUser } from '@/lib/dataStore';

function getSessionToken(cookieHeader = '') {
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith('reading_session='));
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

async function getAuthenticatedUser(req) {
  const token = getSessionToken(req.headers.cookie);
  if (!token) {
    return null;
  }

  const session = await getSession(token);
  if (!session) {
    return null;
  }

  return findUserByEmail(session.email);
}

function sanitizeUser(user) {
  return {
    email: user.email,
    preferences: user.preferences,
    readingData: user.readingData,
    writingDraft: user.writingDraft,
    passages: filterPassagesByPreferences(user.preferences),
  };
}

export default async function handler(req, res) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(sanitizeUser(user));
  }

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { preferences, readingData, writingDraft, resetProgress } = req.body || {};

  const updatedUser = await updateUser(user.email, (currentUser) => ({
    ...currentUser,
    preferences: preferences !== undefined ? preferences : currentUser.preferences,
    readingData: resetProgress
      ? {
          currentStreak: 0,
          bestStreak: 0,
          totalBooksRead: 0,
          lastReadDate: null,
        }
      : readingData !== undefined
        ? readingData
        : currentUser.readingData,
    writingDraft: writingDraft !== undefined ? writingDraft : currentUser.writingDraft,
  }));

  return res.status(200).json(sanitizeUser(updatedUser));
}