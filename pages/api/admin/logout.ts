import type { NextApiRequest, NextApiResponse } from 'next';
import { assertMethod, withApiHandler } from '@/lib/api';
import { endAdminSession } from '@/lib/session';

async function adminLogoutHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: boolean }>,
): Promise<void> {
  assertMethod(req, res, ['POST']);
  await endAdminSession(req, res);
  res.status(200).json({ ok: true });
}

export default withApiHandler(adminLogoutHandler);
