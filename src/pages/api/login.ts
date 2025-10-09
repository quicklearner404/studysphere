import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { verifyPassword, setAuthCookie, signJwt } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { email, password } = parse.data;

  const { data: user, error } = await supabase
    .from('students')
    .select('id, email, name, password_hash')
    .eq('email', email)
    .single();
  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signJwt({ sub: user.id, email: user.email });
  res.setHeader('Set-Cookie', setAuthCookie(token));
  return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name } });
}


