import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/server/study-sessions/services/auth/AuthService';
import { StudySessionService } from '@/server/study-sessions/services/StudySessionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await AuthService.authenticateRequest(req);
    const studySessionService = new StudySessionService();

    switch (req.method) {
      case 'GET':
        const sessions = await studySessionService.getSessionsByHost(userId);
        return res.status(200).json(sessions);

      case 'POST':
        const { title, description, start_time, end_time, max_participants } = req.body;
        
        if (!title || !start_time || !end_time) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const newSession = await studySessionService.createSession({
          title,
          description,
          host_id: userId,
          start_time,
          end_time,
          max_participants: max_participants || 10,
          status: 'scheduled'
        });
        return res.status(201).json(newSession);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Study sessions API error:', error);
    
    if (error instanceof Error) {
      switch (error.message) {
        case 'Missing authorization header':
        case 'Unauthorized':
          return res.status(401).json({ error: error.message });
        default:
          return res.status(500).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}