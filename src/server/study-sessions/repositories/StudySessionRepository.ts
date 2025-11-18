import { supabase } from '@/lib/supabaseClient';
import { BaseRepository } from './base/BaseRepository';
import { StudySession, StudySessionDetails } from '../types';

export class StudySessionRepository extends BaseRepository<StudySession> {
  constructor() {
    super(supabase, 'study_sessions');
  }

  async findByHostId(hostId: string): Promise<StudySession[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findWithDetails(sessionId: string): Promise<StudySessionDetails> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        host:students(name),
        video_conferences(*),
        attendance_records(*, student:students(name))
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(sessionId: string, status: StudySession['status']): Promise<StudySession> {
    return this.update(sessionId, { status });
  }
}