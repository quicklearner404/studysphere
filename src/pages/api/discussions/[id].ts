import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  const id = String(query.id || '');

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('discussions')
        .select('*, author:students(name)')
        .eq('id', id)
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      // Only author (or admin logic if added) can delete
      // Fetch discussion to check owner
      const { data: disc, error: discErr } = await supabaseAdmin.from('discussions').select('author_id').eq('id', id).single();
      if (discErr || !disc) return res.status(404).json({ error: 'Discussion not found' });

      if (disc.author_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { error: delErr } = await supabaseAdmin.from('discussions').delete().eq('id', id);
      if (delErr) return res.status(500).json({ error: delErr.message });
      return res.status(204).end();
    }

    // POST for answers moved to /api/discussion-answers
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Discussion [id] API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
