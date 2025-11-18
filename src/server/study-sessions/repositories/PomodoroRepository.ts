import { supabase } from '@/lib/supabaseClient';
import { BaseRepository } from './base/BaseRepository';

export interface PomodoroSession {
  id: string;
  session_id: string;
  work_duration: number;
  break_duration: number;
  current_phase: 'work' | 'break';
  phase_start_time: string;
  is_active: boolean;
  created_at: string;
}

export class PomodoroRepository extends BaseRepository<PomodoroSession> {
  constructor() {
    super(supabase, 'pomodoro_sessions');
  }

  async findByStudySession(sessionId: string): Promise<PomodoroSession | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) return null;
    return data;
  }

  async updatePhase(pomodoroId: string, phase: 'work' | 'break', startTime: string): Promise<PomodoroSession> {
    return this.update(pomodoroId, {
      current_phase: phase,
      phase_start_time: startTime
    });
  }

  async activatePomodoro(pomodoroId: string): Promise<PomodoroSession> {
    return this.update(pomodoroId, {
      is_active: true
    });
  }

  async deactivatePomodoro(pomodoroId: string): Promise<PomodoroSession> {
    return this.update(pomodoroId, {
      is_active: false
    });
  }
}