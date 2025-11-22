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
      const submittedAnswers: { question_id: string; selected_option_id: string }[] = payload.answers || [];

      // 1. Fetch ALL questions for this quiz to ensure we grade everything
      const { data: allQuestions, error: qError } = await supabaseAdmin
        .from('quiz_questions')
        .select('id')
        .eq('quiz_id', id);

      if (qError || !allQuestions) {
        throw new Error('Failed to fetch quiz questions');
      }

      const allQuestionIds = allQuestions.map((q) => q.id);
      const totalQuestions = allQuestionIds.length;

      // 2. Fetch correct options for ALL questions
      const { data: correctOptions } = await supabaseAdmin
        .from('quiz_options')
        .select('id,question_id')
        .eq('is_correct', true)
        .in('question_id', allQuestionIds);

      const correctMap: Record<string, string> = {};
      (correctOptions || []).forEach((co: any) => { correctMap[co.question_id] = co.id; });

      // 3. Map submitted answers
      const submittedMap: Record<string, string> = {};
      submittedAnswers.forEach((a) => { submittedMap[a.question_id] = a.selected_option_id; });

      let correctCount = 0;
      const attemptAnswers: any[] = [];

      // 4. Grade every question
      for (const qId of allQuestionIds) {
        const selectedId = submittedMap[qId] || null;
        const correctId = correctMap[qId];
        
        // It's correct only if they selected the right option
        const isCorrect = (selectedId && correctId && selectedId === correctId) || false;
        
        if (isCorrect) correctCount += 1;
        
        attemptAnswers.push({ 
          question_id: qId, 
          selected_option_id: selectedId, 
          is_correct: isCorrect 
        });
      }

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
      // award participation points: base 10 per attempt, bonus +10 if score >= 70
      const base = 10;
      const bonus = score >= 70 ? 10 : 0;
      const totalAward = base + bonus;

      try {
        const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('increment_student_points', { student_uuid: user.id, delta: totalAward });
        if (rpcErr) {
          // rpc exists but returned an error
          console.warn('increment_student_points RPC error:', rpcErr.message);
        } else {
          // rpcData will be the new points value (or null)
          // When RPC works, we're done awarding points
        }
      } catch (e) {
        console.warn('increment_student_points RPC failed (likely not present). Falling back to safe update.', e);
      }

      // Fallback: read-then-update (non-atomic) and log if the student row doesn't exist
      try {
        const { data: studentData, error: studentErr } = await supabaseAdmin.from('students').select('points').eq('id', user.id).single();
        if (!studentErr && studentData) {
          const current = Number(studentData.points || 0);
          const { error: finalErr } = await supabaseAdmin.from('students').update({ points: current + totalAward }).eq('id', user.id);
          if (finalErr) console.error('Failed to update student points in fallback:', finalErr);
        } else {
          console.warn('No student row found for user when awarding points. student id:', user.id);
        }
      } catch (ee) {
        console.error('Failed to award quiz points in fallback path:', ee);
      }

      // compute per-question correctness with correct option ids to return
      // We already have correctMap from earlier
      const results = attemptAnswers.map((a) => ({ 
        question_id: a.question_id, 
        selected_option_id: a.selected_option_id, 
        is_correct: a.is_correct, 
        correct_option_id: correctMap[a.question_id] 
      }));

      return res.status(200).json({ score, totalQuestions, correctCount, results });
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e: any) {
    console.error('Quiz attempt API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
