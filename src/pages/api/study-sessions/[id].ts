import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
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
      return getStudySession(req, res, id as string);
    case 'PUT':
      return updateStudySession(req, res, id as string, user.id);
    case 'POST':
      if (req.query.action === 'join') {
        return joinSession(req, res, id as string, user.id);
      }
      if (req.query.action === 'leave') {
        return leaveSession(req, res, id as string, user.id);
      }
      return res.status(400).json({ error: 'Invalid action' });
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

async function getStudySession(req: NextApiRequest, res: NextApiResponse, sessionId: string) {
  const { data: session, error } = await supabase
      .from('study_sessions')
      .select('*, host:students(name), video_conferences(*), attendance_records(*, student:students(name))')
    .eq('id', sessionId)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!session) {
    return res.status(404).json({ error: 'Study session not found' });
  }

  // Ensure nested fields exist and attach host name if missing
  session.video_conferences = session.video_conferences || [];
  session.attendance_records = session.attendance_records || [];
  // Resolve participant/student names in batch to avoid per-row queries
  try {
    const studentIds = Array.from(new Set(
      session.attendance_records.map((r: any) => r.student_id).filter(Boolean)
    ));

    if (studentIds.length) {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds as string[]);

      if (!studentsError && students) {
        const lookup: Record<string, string> = {};
        students.forEach((s: any) => { lookup[s.id] = s.name; });
        session.attendance_records = session.attendance_records.map((r: any) => ({
          ...r,
          student: { name: lookup[r.student_id] }
        }));
      }
    }
  } catch (e) {
    // ignore — frontend has fallback
    console.error('Failed to resolve participant names:', e);
  }

  // Ensure host name exists (fallback to students table by host_id)
  if ((!session.host || !session.host.name) && session.host_id) {
    try {
      const { data: hostData } = await supabase
        .from('students')
        .select('name')
        .eq('id', session.host_id)
        .single();

      if (hostData && hostData.name) {
        session.host = { name: hostData.name };
      }
    } catch (e) {
      // ignore — frontend has fallback
      console.error('Failed to resolve host name:', e);
    }
  }

  return res.status(200).json(session);
}

async function updateStudySession(req: NextApiRequest, res: NextApiResponse, sessionId: string, userId: string) {
  const { title, description, start_time, end_time, max_participants, status } = req.body;

  // Verify user is the host
  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .select('host_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Study session not found' });
  }

  if (session.host_id !== userId) {
    return res.status(403).json({ error: 'Only the host can update the session' });
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      title,
      description,
      start_time,
      end_time,
      max_participants,
      status
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}

async function joinSession(req: NextApiRequest, res: NextApiResponse, sessionId: string, userId: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(
      {
        session_id: sessionId,
        student_id: userId,
        join_time: now,
        leave_time: null
      },
      {
        onConflict: 'session_id,student_id'
      }
    )
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}

async function leaveSession(req: NextApiRequest, res: NextApiResponse, sessionId: string, userId: string) {
  const now = new Date();

  // Find record regardless of leave_time earlier
  const { data: record, error: findError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', sessionId)
    .eq('student_id', userId)
    .single();

  if (findError || !record) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }

  const durationSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(record.join_time).getTime()) / 1000)
  );

  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      leave_time: now.toISOString(),
      duration: `${durationSeconds} seconds`
    })
    .eq('id', record.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
