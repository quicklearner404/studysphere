import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import {
  PomodoroSettings,
  getPomodoroSettings,
  updatePomodoroSettings,
  createPomodoroSession,
  updatePomodoroSession,
  getTotalFocusMinutes
} from '@/lib/pomodoroService';
import MainLayout from '@/components/Layout/MainLayout';

enum TimerState {
  WORK = 'work',
  BREAK = 'break',
  LONG_BREAK = 'long_break',
  IDLE = 'idle'
}

export default function PomodoroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.IDLE);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number | null>(null);
  const { study_session_id } = router.query;

  // Load user settings
  const loadSettings = useCallback(async () => {
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      console.log('Loading settings for user:', session.user.id);
      const userSettings = await getPomodoroSettings(session.user.id);
      console.log('Loaded settings:', userSettings);
      setSettings(userSettings);
      setTimeLeft(userSettings.work_duration * 60);
    } catch (err: any) {
      console.error('Failed to load Pomodoro settings', err);
      setError(err?.message || String(err));
    }
  }, [router]);

  useEffect(() => {
    loadSettings();
    
    // Load total focus minutes
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const total = await getTotalFocusMinutes(session.user.id);
        setTotalFocusMinutes(total);
      } catch (e) {
        console.error('Error loading focus minutes:', e);
      }
    })();
  }, [loadSettings]);

  const startTimer = useCallback(async () => {
    if (!settings) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found when starting timer');
        return;
      }

      console.log('Starting new Pomodoro session for user:', session.user.id);
      const pomSession = await createPomodoroSession(
        session.user.id,
        typeof study_session_id === 'string' ? study_session_id : undefined
      );
      console.log('Created Pomodoro session:', pomSession);
      setCurrentSessionId(pomSession?.id ?? null);

      setTimerState(TimerState.WORK);
      setIsRunning(true);
      setTimeLeft(settings.work_duration * 60);
    } catch (err: any) {
      console.error('Failed to start Pomodoro session', err);
      setError(err?.message || String(err));
      // Still allow local timer to start even if backend failed
      setTimerState(TimerState.WORK);
      setIsRunning(true);
      setTimeLeft(settings.work_duration * 60);
    }
  }, [settings, study_session_id]);

const stopTimer = useCallback(async () => {
  setIsRunning(false);
  setTimerState(TimerState.IDLE);

  if (currentSessionId && settings) {
    console.log('Stopping session:', currentSessionId, 'with count:', sessionCount);
    try {
      // Count only finished Pomodoro blocks
      const completedSessions = Math.floor(sessionCount);
      const focusTimeMinutes = completedSessions * settings.work_duration;

      console.log('Focus finished:', {
        completedSessions,
        focusTimeMinutes,
      });

      const updatedSession = await updatePomodoroSession(currentSessionId, {
        end_time: new Date().toISOString(),
        completed_sessions: completedSessions,
        total_focus_time: focusTimeMinutes,
      });

      console.log('Updated session:', updatedSession);
      setCurrentSessionId(null);
    } catch (err: any) {
      console.error('Error updating session:', err);
      setError(err?.message || String(err));
    }
  }
}, [currentSessionId, sessionCount, settings]);


  // Timer logic
  useEffect(() => {
    if (!isRunning || !settings) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const isWork = timerState === TimerState.WORK;
          if (isWork) {
            setSessionCount((prevCount) => prevCount + 1);
            const needsLongBreak = (sessionCount + 1) % settings.sessions_before_long_break === 0;
            setTimerState(needsLongBreak ? TimerState.LONG_BREAK : TimerState.BREAK);
            return needsLongBreak ? settings.long_break_duration * 60 : settings.break_duration * 60;
          } else {
            setTimerState(TimerState.WORK);
            return settings.work_duration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, settings, timerState, sessionCount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!settings) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-800 font-medium">Loading timer...</p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded max-w-md mx-auto">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={loadSettings}
                  className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white border-2 border-black rounded-lg p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-center mb-8">Pomodoro Timer</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center justify-between">
                <div className="text-sm text-red-700">Error: {error}</div>
                <button
                  onClick={loadSettings}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          <div className="text-center mb-8">
            <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
            <div className="text-xl text-gray-600 capitalize mb-4">
              {timerState === TimerState.IDLE ? 'Ready to focus?' : timerState.replace('_', ' ')}
            </div>
            <div className="text-sm text-gray-500 mb-6">
              Session {sessionCount + 1} of {settings.sessions_before_long_break}
              <span className="ml-2 text-xs text-gray-400">
                (long break after {settings.sessions_before_long_break} sessions)
              </span>
            </div>
            {totalFocusMinutes !== null && (
              <div className="text-sm text-gray-600">
                Total focus time: <strong>{totalFocusMinutes}</strong> minutes
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Focus Session
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                End Session
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold mb-4">Timer Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.work_duration}
                  onChange={async (e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 1) return;
                    
                    try {
                      const updated = await updatePomodoroSettings({
                        ...settings,
                        work_duration: value
                      });
                      setSettings(updated);
                      if (timerState === TimerState.IDLE) {
                        setTimeLeft(value * 60);
                      }
                    } catch (err: any) {
                      console.error('Failed to update work_duration:', err);
                      setError(err?.message || String(err));
                    }
                  }}
                  className="w-full p-2 border rounded"
                  min="1"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.break_duration}
                  onChange={async (e) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 1) return;
                    
                    try {
                      const updated = await updatePomodoroSettings({
                        ...settings,
                        break_duration: value
                      });
                      setSettings(updated);
                    } catch (err: any) {
                      console.error('Failed to update break_duration:', err);
                      setError(err?.message || String(err));
                    }
                  }}
                  className="w-full p-2 border rounded"
                  min="1"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}