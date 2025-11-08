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
      const { data: subjects, error } = await supabaseAdmin
        .from('subjects')
        .select('id,name,description,created_at');

      if (error) return res.status(500).json({ error: error.message });

      // fetch topics for the subjects
      const subjectIds = (subjects || []).map((s: any) => s.id);
      let topics: any[] = [];
      if (subjectIds.length > 0) {
        const { data: t } = await supabaseAdmin.from('topics').select('id,name,description,subject_id').in('subject_id', subjectIds);
        topics = t || [];
      }

      const subjectsWithTopics = (subjects || []).map((s: any) => ({ ...s, topics: topics.filter((t) => t.subject_id === s.id) }));
      return res.status(200).json(subjectsWithTopics);
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Subjects API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
