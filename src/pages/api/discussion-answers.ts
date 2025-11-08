import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const discussion_id = String(req.query.discussion_id || '');
      if (!discussion_id) return res.status(400).json({ error: 'discussion_id required' });

      const { data, error } = await supabaseAdmin
        .from('discussion_answers')
        .select('*, author:students(name)')
        .eq('discussion_id', discussion_id)
        .order('created_at', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { discussion_id, body } = req.body;
      if (!discussion_id) return res.status(400).json({ error: 'discussion_id required' });
      if (!body || !body.trim()) return res.status(400).json({ error: 'Answer body is required' });

      const { data, error } = await supabaseAdmin
        .from('discussion_answers')
        .insert({ discussion_id, author_id: user.id, body: body.trim() })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Discussion answers API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
