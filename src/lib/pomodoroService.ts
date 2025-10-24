import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Pomodoro timer settings table types
export interface PomodoroSettings {
  id: string;
  user_id: string;
  work_duration: number;  // in minutes
  break_duration: number; // in minutes
  long_break_duration: number; // in minutes
  sessions_before_long_break: number;
  created_at: string;
  updated_at: string;
}

// Pomodoro session record types
export interface PomodoroSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  completed_sessions: number;
  total_focus_time?: number; // in minutes (optional)
  study_session_id: string | null; // link to study session if used during one
  created_at: string;
}

// Functions to manage Pomodoro data
export async function getPomodoroSettings(userId: string) {
  console.log('Getting settings for user:', userId);
  
  try {
    // First, try to fetch existing settings
    const { data: existingData, error: fetchError } = await supabase
      .from('pomodoro_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Fetch result:', { existingData, fetchError });

    // If we found existing settings, return them
    if (existingData) {
      console.log('Found existing settings:', existingData);
      return existingData;
    }

    // If no settings exist, create default settings
    const defaultSettings = {
      user_id: userId,
      work_duration: 25,
      break_duration: 5,
      long_break_duration: 15,
      sessions_before_long_break: 4
    };

    console.log('Creating default settings:', defaultSettings);
    
    // Try to upsert settings (insert or update if exists)
    const { data: newSettings, error: insertError } = await supabase
      .from('pomodoro_settings')
      .upsert(defaultSettings, { 
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .maybeSingle();

    console.log('Upsert result:', { newSettings, insertError });

    if (insertError) {
      console.error('Insert error:', insertError);
      // Final attempt to fetch settings in case of race condition
      const { data: finalAttempt } = await supabase
        .from('pomodoro_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (finalAttempt) {
        console.log('Retrieved settings in final attempt:', finalAttempt);
        return finalAttempt;
      }
      
      throw insertError;
    }

    return newSettings;
  } catch (err) {
    console.error('Error in getPomodoroSettings:', err);
    throw err;
  }
}

export async function updatePomodoroSettings(settings: Partial<PomodoroSettings>) {
  console.log('Updating settings:', settings); // Debug log
  const { data, error } = await supabase
    .from('pomodoro_settings')
    .update(settings)
    .eq('user_id', settings.user_id!)
    .select('*')
    .single();
    
  if (error) {
    console.error('Settings update error:', error); // Debug log
    throw error;
  }
  console.log('Updated settings:', data); // Debug log
  return data;
}

export async function createPomodoroSession(userId: string, studySessionId?: string) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: userId,
      start_time: new Date().toISOString(),
      study_session_id: studySessionId,
      completed_sessions: 0
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updatePomodoroSession(sessionId: string, updates: Partial<PomodoroSession>) {
  console.log('Updating session:', sessionId, 'with updates:', updates);
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }
  console.log('Updated session data:', data);
  return data;
}

export async function getPomodoroStats(userId: string) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function getTotalFocusMinutes(userId: string) {
  // Sum total_focus_time across sessions; if column missing or null, treat as 0
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('total_focus_time')
    .eq('user_id', userId);

  if (error) throw error;

  if (!data || data.length === 0) return 0;

  return data.reduce((acc: number, s: any) => acc + (s.total_focus_time || 0), 0);
}