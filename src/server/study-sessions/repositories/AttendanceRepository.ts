import { supabase } from '@/lib/supabaseClient';
import { BaseRepository } from './base/BaseRepository';
import { AttendanceRecord } from '../types';

export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  constructor() {
    super(supabase, 'attendance_records');
  }

  async findBySessionAndStudent(sessionId: string, studentId: string): Promise<AttendanceRecord | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (error) return null;
    return data;
  }

  async upsertAttendance(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(record, {
        onConflict: 'session_id,student_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findBySessionId(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data;
  }

  async getSessionParticipants(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, student:students(name, email)')
      .eq('session_id', sessionId)
      .order('join_time', { ascending: true });

    if (error) throw error;
    return data;
  }
}