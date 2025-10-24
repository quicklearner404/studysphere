import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getStudySessions(req, res);
    case 'POST':
      return createStudySession(req, res, user.id);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get all study sessions (with optional filters)
async function getStudySessions(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, host:students(name)')
    .order('start_time', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}

// Create a new study session
async function createStudySession(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { title, description, start_time, end_time, max_participants } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ error: 'Title and start time are required' });
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      title,
      description,
      host_id: userId,
      start_time,
      end_time,
      max_participants,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Optionally create a video meeting (Daily.co) and persist it to video_conferences
  try {
    const dailyKey = process.env.DAILY_API_KEY;
    const dailyDomain = process.env.NEXT_PUBLIC_DAILY_DOMAIN; // e.g. yourteam.daily.co

    if (dailyKey && dailyDomain) {
      const roomName = `session-${data.id}`;
      const r = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dailyKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: roomName })
      });

      if (r.ok) {
        const roomInfo = await r.json();
        const meetingUrl = roomInfo.url || `https://${dailyDomain}/${roomName}`;

        await supabase.from('video_conferences').insert({
          session_id: data.id,
          meeting_url: meetingUrl,
          provider: 'daily',
          status: 'pending'
        });
      }
    } else {
      // Fallback: create a public Jitsi Meet URL (no API key required)
      const meetingUrl = `https://meet.jit.si/session-${data.id}`;
      await supabase.from('video_conferences').insert({
        session_id: data.id,
        meeting_url: meetingUrl,
        provider: 'jitsi',
        status: 'pending'
      });
    }
  } catch (e) {
    // non-fatal: log and continue
    console.error('Failed to create video room:', e);
  }

  return res.status(201).json(data);
}