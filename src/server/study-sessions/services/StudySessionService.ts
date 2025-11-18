import { StudySessionRepository } from '../repositories/StudySessionRepository';
import { AttendanceRepository } from '../repositories/AttendanceRepository';
import { StudySession, StudySessionDetails } from '../types';

export class StudySessionService {
  constructor(
    private studySessionRepo = new StudySessionRepository(),
    private attendanceRepo = new AttendanceRepository()
  ) {}

  async getSessionWithDetails(sessionId: string): Promise<StudySessionDetails> {
    const session = await this.studySessionRepo.findWithDetails(sessionId);
    
    if (!session) {
      throw new Error('Study session not found');
    }

    // Ensure nested fields exist
    session.video_conferences = session.video_conferences || [];
    session.attendance_records = session.attendance_records || [];

    // Resolve participant names in batch
    await this.resolveParticipantNames(session);

    // Ensure host name exists
    await this.resolveHostName(session);

    return session;
  }

private async resolveParticipantNames(session: StudySessionDetails): Promise<void> {
  try {
    const studentIds = Array.from(new Set(
      session.attendance_records
        .map((r: any) => r.student_id)
        .filter(Boolean)
    ));

    console.log('Student IDs to resolve:', studentIds); // Debug log

    if (studentIds.length > 0) {
      const { data: students, error } = await this.studySessionRepo['supabase']
        .from('students')
        .select('id, name, email')
        .in('id', studentIds);

      console.log('Resolved students:', students); // Debug log
      console.log('Supabase error:', error); // Debug log

      if (!error && students) {
        const lookup: Record<string, any> = {};
        students.forEach((s: any) => { 
          lookup[s.id] = { name: s.name, email: s.email };
        });
        
        session.attendance_records = session.attendance_records.map((r: any) => ({
          ...r,
          student: lookup[r.student_id] || { name: null, email: null }
        }));

        console.log('Updated attendance records:', session.attendance_records); // Debug log
      }
    }
  } catch (error) {
    console.error('Failed to resolve participant names:', error);
  }
}

  private async resolveHostName(session: StudySessionDetails): Promise<void> {
    try {
      if ((!session.host || !session.host.name) && session.session.host_id) {
        const { data: hostData } = await this.studySessionRepo['supabase']
          .from('students')
          .select('name')
          .eq('id', session.session.host_id)
          .single();

        if (hostData?.name) {
          session.host = { name: hostData.name };
        }
      }
    } catch (error) {
      console.error('Failed to resolve host name:', error);
      // Continue without host name - frontend has fallback
    }
  }

  async updateSession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
    return this.studySessionRepo.update(sessionId, updates);
  }

  async createSession(sessionData: Partial<StudySession>): Promise<StudySession> {
    return this.studySessionRepo.create(sessionData);
  }

  async getSessionsByHost(hostId: string): Promise<StudySession[]> {
    return this.studySessionRepo.findByHostId(hostId);
  }
}