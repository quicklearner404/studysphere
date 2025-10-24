import { supabase } from './supabaseClient';

export type PomodoroStatusType = 'focus' | 'break' | 'long-break' | 'idle';

export async function updatePomodoroStatus(
  userId: string,
  userName: string,
  studySessionId: string,
  status: PomodoroStatusType,
  timeLeft?: number
) {
  const { data, error } = await supabase
    .from('pomodoro_status')
    .upsert({
      user_id: userId,
      study_session_id: studySessionId,
      user_name: userName,
      status,
      time_left: timeLeft
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function clearPomodoroStatus(
  userId: string,
  studySessionId: string
) {
  const { error } = await supabase
    .from('pomodoro_status')
    .delete()
    .match({ user_id: userId, study_session_id: studySessionId });

  if (error) throw error;
}