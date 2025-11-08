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
      const { subject_id, topic_id } = req.query;

      let query = supabaseAdmin.from('quizzes').select('id,title,description,created_at,topic_id').order('created_at', { ascending: false });

      if (topic_id) {
        query = query.eq('topic_id', String(topic_id));
      } else if (subject_id) {
        // filter quizzes by subject via topics
        // fetch topic ids for subject
        const { data: topicRows, error: topicErr } = await supabaseAdmin.from('topics').select('id').eq('subject_id', String(subject_id));
        if (topicErr) return res.status(500).json({ error: topicErr.message });
        const topicIds = (topicRows || []).map((t: any) => t.id);
        if (topicIds.length > 0) query = query.in('topic_id', topicIds);
        else return res.status(200).json([]);
      }

      const { data, error } = await query;

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Quizzes API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
