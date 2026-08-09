import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthResponse } from '@/types/api';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { findUserByEmail, updateUser } from '@/lib/dataStore';
import { hashPassword, verifyPassword } from '@/lib/password';
import { startSession } from '@/lib/session';
import { parseAuthPayload } from '@/lib/validation';

async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>,
): Promise<void> {
  assertMethod(req, res, ['POST']);
  const { email, password } = parseAuthPayload(req.body as unknown);
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  const verification = await verifyPassword(password, user.passwordHash);
  if (!verification.valid) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  if (verification.needsUpgrade) {
    const upgradedHash = await hashPassword(password);
    await updateUser(email, (currentUser) =>
      currentUser.passwordHash === user.passwordHash
        ? { ...currentUser, passwordHash: upgradedHash }
        : currentUser,
    );
  }

  await startSession(email, res);
  res.status(200).json({ email });
}

export default withApiHandler(loginHandler);
