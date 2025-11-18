import { AttendanceRepository } from '../repositories/AttendanceRepository';

export class AttendanceService {
  constructor(private attendanceRepo = new AttendanceRepository()) {}

  async joinSession(sessionId: string, studentId: string) {
    const now = new Date().toISOString();
    
    return this.attendanceRepo.upsertAttendance({
      session_id: sessionId,
      student_id: studentId,
      join_time: now,
      leave_time: null,
      duration: null
    });
  }

  async leaveSession(sessionId: string, studentId: string) {
    const record = await this.attendanceRepo.findBySessionAndStudent(sessionId, studentId);
    
    if (!record) {
      throw new Error('Attendance record not found');
    }

    const now = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((now.getTime() - new Date(record.join_time).getTime()) / 1000)
    );

    return this.attendanceRepo.update(record.id, {
      leave_time: now.toISOString(),
      duration: `${durationSeconds} seconds`
    });
  }

  async getSessionParticipants(sessionId: string) {
    return this.attendanceRepo.getSessionParticipants(sessionId);
  }

  async getAttendanceRecord(sessionId: string, studentId: string) {
    return this.attendanceRepo.findBySessionAndStudent(sessionId, studentId);
  }
}