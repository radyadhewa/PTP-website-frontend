import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdminAuthResponse } from '@/types/api';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/session';

async function adminMeHandler(
  req: NextApiRequest,
  res: NextApiResponse<AdminAuthResponse>,
): Promise<void> {
  assertMethod(req, res, ['GET']);
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    throw new ApiError(401, 'Unauthorized admin session.');
  }

  res.status(200).json({ authenticated: true, username: admin.username });
}

export default withApiHandler(adminMeHandler);
