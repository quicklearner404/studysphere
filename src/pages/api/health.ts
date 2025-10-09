import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const urlOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const keyOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error } = await supabase.from('students').select('id').limit(1);
  return res.status(200).json({ env: { urlOk, keyOk }, dbOk: !error, error: error?.message });
}


