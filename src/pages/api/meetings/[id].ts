import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/server/study-sessions/services/auth/AuthService';
import { MeetingService } from '@/server/study-sessions/services/MeetingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    const userId = await AuthService.authenticateRequest(req);
    const meetingService = new MeetingService();

    switch (req.method) {
      case 'GET':
        const meeting = await meetingService.getMeeting(id as string);
        if (!meeting) {
          return res.status(404).json({ error: 'Meeting not found' });
        }
        return res.status(200).json(meeting);

      case 'PUT':
        const existingMeeting = await meetingService.getMeeting(id as string);
        if (!existingMeeting) {
          return res.status(404).json({ error: 'Meeting not found' });
        }

        // Verify user owns the session
        const isOwner = await AuthService.validateSessionOwnership(existingMeeting.session_id, userId);
        if (!isOwner) {
          return res.status(403).json({ error: 'Only the host can update meetings' });
        }

        const { status } = req.body;
        if (!status || !['scheduled', 'active', 'ended'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedMeeting = await meetingService.updateMeetingStatus(id as string, status);
        return res.status(200).json(updatedMeeting);

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Meeting API error:', error);
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
      case 'Only the host can update meetings':
        return res.status(403).json({ error: error.message });
      default:
        return res.status(500).json({ error: error.message });
    }
  }
  return res.status(500).json({ error: 'Internal server error' });
}