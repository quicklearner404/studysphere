// Location: src/pages/api/profile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch student basic info
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, name, email, points, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (studentError) {
        return res.status(500).json({ error: studentError.message });
      }

      // Calculate quiz stats
      const { data: quizAttempts, error: quizError } = await supabaseAdmin
        .from('quiz_attempts')
        .select('score')
        .eq('student_id', user.id);

      const totalQuizzes = quizAttempts?.length || 0;
      const averageScore = totalQuizzes > 0 && quizAttempts
        ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes)
        : 0;

      // Calculate study session stats (sessions attended)
      const { data: attendanceRecords, error: attendanceError } = await supabaseAdmin
        .from('attendance_records')
        .select('duration')
        .eq('student_id', user.id)
        .not('duration', 'is', null);

      const totalStudySessions = attendanceRecords?.length || 0;

      // Calculate total study time from attendance records
      let totalStudyTimeSeconds = 0;
      if (attendanceRecords) {
        for (const record of attendanceRecords) {
          if (record.duration) {
            // Parse PostgreSQL interval format (e.g., "01:30:00" or "1 hour 30 mins")
            const duration = record.duration;
            const matches = duration.match(/(\d+):(\d+):(\d+)/);
            if (matches) {
              const hours = parseInt(matches[1]);
              const minutes = parseInt(matches[2]);
              const seconds = parseInt(matches[3]);
              totalStudyTimeSeconds += (hours * 3600) + (minutes * 60) + seconds;
            }
          }
        }
      }

      // Calculate pomodoro stats
      const { data: pomodoroSessions, error: pomodoroError } = await supabaseAdmin
        .from('pomodoro_sessions')
        .select('completed_sessions, total_focus_time')
        .eq('user_id', user.id);

      const totalPomodoroSessions = pomodoroSessions?.reduce((sum, session) => 
        sum + (session.completed_sessions || 0), 0) || 0;

      const totalPomodoroTime = pomodoroSessions?.reduce((sum, session) => 
        sum + (session.total_focus_time || 0), 0) || 0;

      // Combine study time from attendance and pomodoro
      const totalStudyTime = totalStudyTimeSeconds + totalPomodoroTime;

      return res.status(200).json({
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          points: student.points,
          created_at: student.created_at,
          updated_at: student.updated_at,
          stats: {
            totalQuizzes,
            averageScore,
            totalStudySessions,
            totalStudyTime,
            totalPomodoroSessions
          }
        }
      });
    }

    if (req.method === 'PUT') {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update({ 
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('id, name, email, points, created_at, updated_at')
        .single();

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      // Recalculate stats after update
      const { data: quizAttempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('score')
        .eq('student_id', user.id);

      const totalQuizzes = quizAttempts?.length || 0;
      const averageScore = totalQuizzes > 0 && quizAttempts
        ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes)
        : 0;

      const { data: attendanceRecords } = await supabaseAdmin
        .from('attendance_records')
        .select('duration')
        .eq('student_id', user.id)
        .not('duration', 'is', null);

      const totalStudySessions = attendanceRecords?.length || 0;

      let totalStudyTimeSeconds = 0;
      if (attendanceRecords) {
        for (const record of attendanceRecords) {
          if (record.duration) {
            const matches = record.duration.match(/(\d+):(\d+):(\d+)/);
            if (matches) {
              const hours = parseInt(matches[1]);
              const minutes = parseInt(matches[2]);
              const seconds = parseInt(matches[3]);
              totalStudyTimeSeconds += (hours * 3600) + (minutes * 60) + seconds;
            }
          }
        }
      }

      const { data: pomodoroSessions } = await supabaseAdmin
        .from('pomodoro_sessions')
        .select('completed_sessions, total_focus_time')
        .eq('user_id', user.id);

      const totalPomodoroSessions = pomodoroSessions?.reduce((sum, session) => 
        sum + (session.completed_sessions || 0), 0) || 0;

      const totalPomodoroTime = pomodoroSessions?.reduce((sum, session) => 
        sum + (session.total_focus_time || 0), 0) || 0;

      const totalStudyTime = totalStudyTimeSeconds + totalPomodoroTime;

      return res.status(200).json({
        student: {
          id: updatedStudent.id,
          name: updatedStudent.name,
          email: updatedStudent.email,
          points: updatedStudent.points,
          created_at: updatedStudent.created_at,
          updated_at: updatedStudent.updated_at,
          stats: {
            totalQuizzes,
            averageScore,
            totalStudySessions,
            totalStudyTime,
            totalPomodoroSessions
          }
        }
      });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}