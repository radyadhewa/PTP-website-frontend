import type { NextApiRequest, NextApiResponse } from 'next';
import { assertMethod, withApiHandler } from '@/lib/api';
import { endSession } from '@/lib/session';

interface LogoutResponse {
  ok: true;
}

async function logoutHandler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>,
): Promise<void> {
  assertMethod(req, res, ['POST']);
  await endSession(req, res);
  res.status(200).json({ ok: true });
}

export default withApiHandler(logoutHandler);
