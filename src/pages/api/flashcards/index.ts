import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// GET /api/flashcards?deckId=...&due=true
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { deckId, due } = req.query;

    let deckIds: string[] = [];

    if (deckId) {
      deckIds = Array.isArray(deckId) ? deckId : [String(deckId)];
    } else {
      // get decks created by user
      const { data: decks } = await supabaseAdmin
        .from('flashcard_decks')
        .select('id')
        .eq('created_by', user.id);
      deckIds = Array.isArray(decks) ? (decks as any[]).map(d => d.id) : [];
    }

    if (!deckIds || deckIds.length === 0) {
      return res.status(200).json({ flashcards: [] });
    }

    let query = supabaseAdmin
      .from('flashcards')
      .select('*')
      .in('deck_id', deckIds);

    if (String(due) === 'true') {
      query = query.lte('next_review_at', new Date().toISOString());
    }

    const { data: flashcards, error: fetchErr } = await query;
    if (fetchErr) {
      console.error('Failed to fetch flashcards:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch flashcards' });
    }

    return res.status(200).json({ flashcards });
  } catch (e) {
    console.error('Error in /api/flashcards GET:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
