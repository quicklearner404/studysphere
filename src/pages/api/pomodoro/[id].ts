import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/server/study-sessions/services/auth/AuthService';
import { PomodoroService } from '@/server/study-sessions/services/PomodoroService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    const userId = await AuthService.authenticateRequest(req);
    const pomodoroService = new PomodoroService();

    const pomodoroSession = await pomodoroService.getPomodoroByStudySession(id as string);
    if (!pomodoroSession) {
      return res.status(404).json({ error: 'Pomodoro session not found' });
    }

    // Verify user owns the session
    const isOwner = await AuthService.validateSessionOwnership(pomodoroSession.session_id, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the host can manage pomodoro sessions' });
    }

    switch (req.method) {
      case 'GET':
        return res.status(200).json(pomodoroSession);

      case 'PUT':
        const { action, phase } = req.body;
        
        if (action === 'switch_phase') {
          if (!phase || !['work', 'break'].includes(phase)) {
            return res.status(400).json({ error: 'Invalid phase' });
          }
          const updatedPomodoro = await pomodoroService.switchPhase(pomodoroSession.id, phase);
          return res.status(200).json(updatedPomodoro);
        }
        
        if (action === 'activate') {
          const updatedPomodoro = await pomodoroService.activatePomodoro(pomodoroSession.id);
          return res.status(200).json(updatedPomodoro);
        }
        
        if (action === 'deactivate') {
          const updatedPomodoro = await pomodoroService.deactivatePomodoro(pomodoroSession.id);
          return res.status(200).json(updatedPomodoro);
        }

        return res.status(400).json({ error: 'Invalid action' });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
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
      case 'Pomodoro session not found':
        return res.status(404).json({ error: error.message });
      case 'Only the host can manage pomodoro sessions':
        return res.status(403).json({ error: error.message });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
  return res.status(500).json({ error: 'Internal server error' });
}