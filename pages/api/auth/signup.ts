import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthResponse } from '@/types/api';
import type { UserProfile } from '@/types/domain';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { createUser } from '@/lib/dataStore';
import { hashPassword } from '@/lib/password';
import { startSession } from '@/lib/session';
import { parseSignupPayload } from '@/lib/validation';

async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>,
): Promise<void> {
  assertMethod(req, res, ['POST']);
  const { email, password } = parseSignupPayload(req.body as unknown);
  const passwordHash = await hashPassword(password);
  const user: UserProfile = {
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
    preferences: null,
    readingData: {
      currentStreak: 0,
      bestStreak: 0,
      totalBooksRead: 0,
      lastReadDate: null,
    },
    writingDraft: {
      introduction: '',
      body: '',
      conclusion: '',
    },
  };

  if (!(await createUser(user))) {
    throw new ApiError(409, 'An account with that email already exists.');
  }

  await startSession(email, res);
  res.status(201).json({ email });
}

export default withApiHandler(signupHandler);
