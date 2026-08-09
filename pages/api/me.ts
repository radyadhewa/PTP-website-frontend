import type { NextApiRequest, NextApiResponse } from 'next';
import type { ProfilePatch, PublicProfile, ReadingData, UserProfile } from '@/types/domain';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { updateUser } from '@/lib/dataStore';
import { filterPassagesByPreferences } from '@/lib/passages';
import { getAuthenticatedUser } from '@/lib/session';
import { parseProfilePatch } from '@/lib/validation';

function sanitizeUser(user: UserProfile): PublicProfile {
  return {
    email: user.email,
    preferences: user.preferences,
    readingData: user.readingData,
    writingDraft: user.writingDraft,
    passages: filterPassagesByPreferences(user.preferences),
  };
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function storedDateKey(value: string | null): string | null {
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : localDateKey(parsed);
}

function markRead(readingData: ReadingData, now = new Date()): ReadingData {
  const today = localDateKey(now);
  if (storedDateKey(readingData.lastReadDate) === today) {
    return readingData;
  }

  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const continuedStreak = storedDateKey(readingData.lastReadDate) === localDateKey(yesterdayDate);
  const currentStreak = continuedStreak ? readingData.currentStreak + 1 : 1;

  return {
    currentStreak,
    bestStreak: Math.max(readingData.bestStreak, currentStreak),
    totalBooksRead: readingData.totalBooksRead + 1,
    lastReadDate: now.toDateString(),
  };
}

function applyPatch(user: UserProfile, patch: ProfilePatch): UserProfile {
  switch (patch.action) {
    case 'updatePreferences':
      return { ...user, preferences: patch.preferences };
    case 'updateWriting':
      return { ...user, writingDraft: patch.writingDraft };
    case 'markRead': {
      const readingData = markRead(user.readingData);
      return readingData === user.readingData ? user : { ...user, readingData };
    }
    case 'resetProgress':
      return {
        ...user,
        readingData: {
          currentStreak: 0,
          bestStreak: 0,
          totalBooksRead: 0,
          lastReadDate: null,
        },
      };
  }
}

async function meHandler(req: NextApiRequest, res: NextApiResponse<PublicProfile>): Promise<void> {
  assertMethod(req, res, ['GET', 'PATCH']);
  const patch = req.method === 'PATCH' ? parseProfilePatch(req.body as unknown) : null;
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new ApiError(401, 'Unauthorized.');
  }

  if (!patch) {
    res.status(200).json(sanitizeUser(user));
    return;
  }

  const updatedUser = await updateUser(user.email, (currentUser) => applyPatch(currentUser, patch));
  if (!updatedUser) {
    throw new ApiError(401, 'Unauthorized.');
  }
  res.status(200).json(sanitizeUser(updatedUser));
}

export default withApiHandler(meHandler);
