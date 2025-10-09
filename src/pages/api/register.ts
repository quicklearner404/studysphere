import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { hashPassword, setAuthCookie, signJwt } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { name, email, password } = parse.data;

  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await hashPassword(password);
  const { data, error } = await supabase
    .from('students')
    .insert({ name, email, password_hash })
    .select('id, name, email')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const token = signJwt({ sub: data.id, email: data.email });
  res.setHeader('Set-Cookie', setAuthCookie(token));
  return res.status(201).json({ user: data });
}


