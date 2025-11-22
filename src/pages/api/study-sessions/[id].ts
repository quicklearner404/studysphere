import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/server/study-sessions/services/auth/AuthService';
import { StudySessionService } from '@/server/study-sessions/services/StudySessionService';
import { AttendanceService } from '@/server/study-sessions/services/AttendanceService';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    const userId = await AuthService.authenticateRequest(req);
    
    const studySessionService = new StudySessionService();
    const attendanceService = new AttendanceService();

    switch (req.method) {
      case 'GET':
        const session = await studySessionService.getSessionWithDetails(id as string);
        return res.status(200).json(session);

      case 'PUT':
        const isOwner = await AuthService.validateSessionOwnership(id as string, userId);
        if (!isOwner) {
          return res.status(403).json({ error: 'Only the host can update the session' });
        }

        const { title, description, start_time, end_time, max_participants, status } = req.body;
        const updatedSession = await studySessionService.updateSession(id as string, {
          title,
          description,
          start_time,
          end_time,
          max_participants,
          status
        });
        return res.status(200).json(updatedSession);

      case 'POST':
        if (req.query.action === 'join') {
          const joinRecord = await attendanceService.joinSession(id as string, userId);
          return res.status(200).json(joinRecord);
        }
        if (req.query.action === 'leave') {
          const leaveRecord = await attendanceService.leaveSession(id as string, userId);
          return res.status(200).json(leaveRecord);
        }
        return res.status(400).json({ error: 'Invalid action' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Study session API error:', error);
    
    if (error instanceof Error) {
      switch (error.message) {
        case 'Missing authorization header':
        case 'Unauthorized':
          return res.status(401).json({ error: error.message });
        case 'Study session not found':
        case 'Attendance record not found':
          return res.status(404).json({ error: error.message });
        case 'Only the host can update the session':
          return res.status(403).json({ error: error.message });
        default:
          return res.status(500).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}