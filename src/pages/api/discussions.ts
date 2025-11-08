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
      const { data, error } = await supabaseAdmin
        .from('discussions')
        .select('*, author:students(name), discussion_answers(*)')
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, body } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

      const { data, error } = await supabaseAdmin
        .from('discussions')
        .insert({ title: title.trim(), body: body || null, author_id: user.id })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      // Award participation points for creating a question
      try {
        const { data: studentData, error: studentErr } = await supabaseAdmin
          .from('students')
          .select('points')
          .eq('id', user.id)
          .single();

        if (!studentErr && studentData) {
          const current = Number(studentData.points || 0);
          const newPoints = current + 10; // +10 points for posting a question
          await supabaseAdmin.from('students').update({ points: newPoints }).eq('id', user.id);
        }
      } catch (e) {
        console.error('Failed to award points for question:', e);
      }

      return res.status(201).json(data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Discussions API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
