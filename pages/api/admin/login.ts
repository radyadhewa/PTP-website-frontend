import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminAuthResponse } from '@/types/api';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { startAdminSession } from '@/lib/session';
import { parseAdminLoginPayload } from '@/lib/validation';

const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function adminLoginHandler(
  req: NextApiRequest,
  res: NextApiResponse<AdminAuthResponse>,
): Promise<void> {
  assertMethod(req, res, ['POST']);
  const payload = parseAdminLoginPayload(req.body as unknown);

  if (
    payload.username !== DEFAULT_ADMIN_USERNAME ||
    payload.password !== DEFAULT_ADMIN_PASSWORD
  ) {
    throw new ApiError(401, 'Invalid admin username or password.');
  }

  await startAdminSession(payload.username, res);
  res.status(200).json({ authenticated: true, username: payload.username });
}

export default withApiHandler(adminLoginHandler);
