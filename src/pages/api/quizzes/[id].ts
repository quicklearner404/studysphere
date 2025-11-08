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
      // Fetch quiz, questions and options but DO NOT expose is_correct to the client
      const { data: quiz, error: quizErr } = await supabaseAdmin
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz not found' });

      const { data: questions } = await supabaseAdmin
        .from('quiz_questions')
        .select('id,question_text,"order"')
        .eq('quiz_id', id)
        .order('order', { ascending: true });

      // fetch options for the questions
      const questionIds = (questions || []).map((q: any) => q.id);
      let options: any[] = [];
      if (questionIds.length > 0) {
        const { data: opts } = await supabaseAdmin
          .from('quiz_options')
          .select('id,question_id,option_text')
          .in('question_id', questionIds);
        options = opts || [];
      }

      // attach options to questions
      const qWithOptions = (questions || []).map((q: any) => ({
        ...q,
        options: options.filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, option_text: o.option_text }))
      }));

      return res.status(200).json({ quiz, questions: qWithOptions });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Quiz [id] API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
