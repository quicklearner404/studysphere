// Deprecated endpoint: use /api/leaderboard instead.
import type { NextApiRequest, NextApiResponse } from 'next';

export default function deprecatedHandler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: 'Deprecated. Use /api/leaderboard' });
}
