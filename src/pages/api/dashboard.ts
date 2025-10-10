import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // ← CHANGE THIS LINE

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase ADMIN client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get student data
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('name, points')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      greeting: `Welcome, ${data.name}!`, 
      points: data.points 
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}