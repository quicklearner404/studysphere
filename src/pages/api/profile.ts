import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { getTokenFromReq, verifyJwt } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getTokenFromReq(req);
  const payload = token ? verifyJwt<{ sub: string }>(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, points, personal_stats, created_at, updated_at')
      .eq('id', payload.sub)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  if (req.method === 'PUT') {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
    const { name, personalStats } = parse.data;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (personalStats) updates.personal_stats = personalStats;

    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', payload.sub)
      .select('id, name, email, points, personal_stats, created_at, updated_at')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  return res.status(405).end();
}


