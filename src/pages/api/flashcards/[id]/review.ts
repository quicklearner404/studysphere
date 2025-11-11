import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// SM-2 update helper
function computeSM2(repetition: number, interval: number, ease: number, quality: number) {
  // quality: 0..5
  let rep = repetition;
  let intv = interval;
  let ef = ease;

  if (quality < 3) {
    rep = 0;
    intv = 1;
  } else {
    rep = rep + 1;
    if (rep === 1) intv = 1;
    else if (rep === 2) intv = 6;
    else intv = Math.max(1, Math.round(intv * ef));

    // update ease factor
    // SM-2 formula: ef := ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;
  }

  return { repetition: rep, interval: intv, ease: Number(ef.toFixed(2)) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing flashcard id' });

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const payload = req.body || {};
    let quality: number | undefined = payload.quality;
    const result = payload.result as string | undefined;

    if (quality === undefined) {
      // map common result labels to quality
      if (result === 'again') quality = 0;
      else if (result === 'hard') quality = 2;
      else if (result === 'good') quality = 4;
      else if (result === 'easy') quality = 5;
    }

    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      return res.status(400).json({ error: 'Invalid quality (0..5) or result label required' });
    }

    // fetch flashcard
    const { data: card, error: fetchErr } = await supabaseAdmin
      .from('flashcards')
      .select('*')
      .eq('id', String(id))
      .single();

    if (fetchErr || !card) {
      console.error('Failed to fetch flashcard:', fetchErr);
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Optionally: check deck ownership: only allow reviews for decks owned by user
    // We'll skip strict ownership check to allow review flows where deck access is broader.

    const currentRep = Number(card.repetition_count || 0);
    const currentInt = Number(card.interval_days || 1);
    const currentEase = Number(card.ease || 2.5);

    const updated = computeSM2(currentRep, currentInt, currentEase, Math.round(quality));

    const nextReview = new Date();
    nextReview.setUTCDate(nextReview.getUTCDate() + Number(updated.interval));

    const updatePayload = {
      repetition_count: updated.repetition,
      interval_days: updated.interval,
      ease: updated.ease,
      last_reviewed: new Date().toISOString(),
      next_review_at: nextReview.toISOString()
    };

    const { data: newCard, error: updateErr } = await supabaseAdmin
      .from('flashcards')
      .update(updatePayload)
      .eq('id', String(id))
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update flashcard SRS fields:', updateErr);
      return res.status(500).json({ error: 'Failed to update flashcard' });
    }

    return res.status(200).json({ flashcard: newCard });

  } catch (e) {
    console.error('Error in /api/flashcards/[id]/review POST:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
