import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { getTokenFromReq, verifyJwt } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getTokenFromReq(req);
  const payload = token ? verifyJwt<{ sub: string }>(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  // Basic sample dashboard: total points and profile name
  const { data, error } = await supabase
    .from('students')
    .select('name, points')
    .eq('id', payload.sub)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ greeting: `Welcome, ${data.name}!`, points: data.points });
}


