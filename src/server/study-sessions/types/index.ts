export interface StudySession {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  start_time: string;
  end_time: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  max_participants: number | null;
  created_at: string;
}

export interface VideoConference {
  id: string;
  session_id: string;
  meeting_url: string | null;
  provider: string;
  status: 'pending' | 'active' | 'ended';
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  join_time: string;
  leave_time: string | null;
  duration: string | null;
  // optional joined student info (populated by API)
  student?: { name?: string } | null;
}

export interface StudySessionDetails {
  session: StudySession;
  host: { name: string };
  video_conferences: VideoConference[];
  attendance_records: AttendanceRecord[];
}