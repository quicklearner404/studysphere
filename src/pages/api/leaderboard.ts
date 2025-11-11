import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

type LeaderboardRow = {
  id: string;
  name: string;
  points: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, name, points')
      .order('points', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return res.status(500).json({ error: 'Failed to load leaderboard' });
    }

    const rows: LeaderboardRow[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name || 'Anonymous',
      points: Number(r.points || 0)
    }));

    const withRank = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    return res.status(200).json({ leaderboard: withRank });
  } catch (e) {
    console.error('Unexpected leaderboard error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
