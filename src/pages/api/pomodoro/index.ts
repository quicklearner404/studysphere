import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/server/study-sessions/services/auth/AuthService';
import { PomodoroService } from '@/server/study-sessions/services/PomodoroService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await AuthService.authenticateRequest(req);
    const pomodoroService = new PomodoroService();

    switch (req.method) {
      case 'POST':
        const { session_id, work_duration, break_duration } = req.body;
        
        if (!session_id || !work_duration || !break_duration) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify user owns the session
        const isOwner = await AuthService.validateSessionOwnership(session_id, userId);
        if (!isOwner) {
          return res.status(403).json({ error: 'Only the host can create pomodoro sessions' });
        }

        const newPomodoro = await pomodoroService.createPomodoroSession({
          session_id,
          work_duration,
          break_duration
        });
        return res.status(201).json(newPomodoro);

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Pomodoro API error:', error);
    return handleError(res, error);
  }
}

function handleError(res: NextApiResponse, error: unknown) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'Missing authorization header':
      case 'Unauthorized':
        return res.status(401).json({ error: error.message });
      case 'Study session not found':
        return res.status(404).json({ error: error.message });
      case 'Only the host can create pomodoro sessions':
        return res.status(403).json({ error: error.message });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
  return res.status(500).json({ error: 'Internal server error' });
}