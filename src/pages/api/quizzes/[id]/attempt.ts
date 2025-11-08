import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  const id = String(query.id || ''); // quiz id

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const payload = req.body;
      const answers: { question_id: string; selected_option_id: string }[] = payload.answers || [];

      // fetch correct options for these questions
      const questionIds = answers.map((a) => a.question_id);

      const { data: correctOptions } = await supabaseAdmin
        .from('quiz_options')
        .select('id,question_id')
        .eq('is_correct', true)
        .in('question_id', questionIds || []);

      const correctMap: Record<string, string> = {};
      (correctOptions || []).forEach((co: any) => { correctMap[co.question_id] = co.id; });

      let correctCount = 0;
      const attemptAnswers: any[] = [];
      for (const a of answers) {
        const correctId = correctMap[a.question_id];
        const isCorrect = correctId ? correctId === a.selected_option_id : false;
        if (isCorrect) correctCount += 1;
        attemptAnswers.push({ question_id: a.question_id, selected_option_id: a.selected_option_id, is_correct: isCorrect });
      }

      // total questions count
      const totalQuestions = questionIds.length || 0;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      // insert attempt
      const { data: attemptData, error: attemptErr } = await supabaseAdmin
        .from('quiz_attempts')
        .insert({ quiz_id: id, student_id: user.id, score })
        .select()
        .single();

      if (attemptErr || !attemptData) {
        return res.status(500).json({ error: attemptErr?.message || 'Failed to record attempt' });
      }

      const attemptId = attemptData.id;

      // insert answers
      const inserts = attemptAnswers.map((aa) => ({ attempt_id: attemptId, question_id: aa.question_id, selected_option_id: aa.selected_option_id, is_correct: aa.is_correct }));
      if (inserts.length > 0) {
        await supabaseAdmin.from('quiz_attempt_answers').insert(inserts);
      }

      // award participation points: base 10 per attempt, bonus +10 if score >= 70
      try {
        const base = 10;
        const bonus = score >= 70 ? 10 : 0;
        const totalAward = base + bonus;
        await supabaseAdmin.rpc('increment_student_points', { student_uuid: user.id, delta: totalAward });
      } catch (e) {
        // fallback: read current points and update (non-atomic but compatible)
        try {
          const base = 10;
          const bonus = score >= 70 ? 10 : 0;
          const totalAward = base + bonus;
          const { data: studentData, error: studentErr } = await supabaseAdmin.from('students').select('points').eq('id', user.id).single();
          if (!studentErr && studentData) {
            const current = Number(studentData.points || 0);
            await supabaseAdmin.from('students').update({ points: current + totalAward }).eq('id', user.id);
          }
        } catch (ee) {
          console.error('Failed to award quiz points:', ee);
        }
      }

      // compute per-question correctness with correct option ids to return
      const { data: corrects } = await supabaseAdmin
        .from('quiz_options')
        .select('id,question_id')
        .eq('is_correct', true)
        .in('question_id', questionIds || []);

      const correctByQ: Record<string, string> = {};
      (corrects || []).forEach((c: any) => { correctByQ[c.question_id] = c.id; });

      const results = attemptAnswers.map((a) => ({ question_id: a.question_id, selected_option_id: a.selected_option_id, is_correct: a.is_correct, correct_option_id: correctByQ[a.question_id] }));

      return res.status(200).json({ score, totalQuestions, correctCount, results });
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Quiz attempt API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
