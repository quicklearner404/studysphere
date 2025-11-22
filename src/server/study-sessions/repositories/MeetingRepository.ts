import { supabase } from '@/lib/supabaseClient';
import { BaseRepository } from './base/BaseRepository';
import { VideoConference } from '../types';

export class MeetingRepository extends BaseRepository<VideoConference> {
  constructor() {
    super(supabase, 'video_conferences');
  }

  async findBySessionId(sessionId: string): Promise<VideoConference[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data;
  }

  async createMeeting(sessionId: string, meetingUrl: string): Promise<VideoConference> {
    return this.create({
      session_id: sessionId,
      meeting_url: meetingUrl,
      provider: 'default', // or get from parameters
      status: 'pending'
    });
  }

  async updateMeetingStatus(meetingId: string, status: VideoConference['status']): Promise<VideoConference> {
    return this.update(meetingId, { status });
  }
}