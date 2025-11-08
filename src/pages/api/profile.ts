// ==================== FILE 1: API ROUTE ====================
// Location: src/pages/api/profile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client (uses service role key for backend operations)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface Student {
  id: string;
  name: string;
  email: string;
  points: number;
  personal_stats: {
    totalQuizzes?: number;
    averageScore?: number;
    studyStreak?: number;
    totalStudyTime?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  student: Student;
}

type ApiResponse = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  console.log(`🔵 API Request: ${req.method} /api/profile`);

  // Handle GET request - Fetch profile
  if (req.method === 'GET') {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        console.error('❌ No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      console.log('🔍 Verifying token...');
      
      // Verify token and get user
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        console.error('❌ Invalid token:', authError);
        return res.status(401).json({ error: 'Invalid token' });
      }

      console.log(`✅ User verified: ${user.id}`);
      console.log('📊 Fetching student data...');

      // Fetch student data
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      if (studentError) {
        console.error('❌ Student fetch error:', studentError);
        return res.status(404).json({ error: 'Student not found' });
      }

      console.log('✅ Student data fetched successfully');
      // Compute dynamic quiz stats from quiz_attempts
      try {
        const { data: attempts, count: attemptsCount, error: attemptsErr } = await supabaseAdmin
          .from('quiz_attempts')
          .select('score', { count: 'exact' })
          .eq('student_id', user.id);
        if (!attemptsErr) {
          const totalQuizzes = Number(attemptsCount || 0);
          let averageScore = 0;
          if (totalQuizzes > 0 && Array.isArray(attempts)) {
            const sum = (attempts as any[]).reduce((s, a) => s + Number(a.score || 0), 0);
            averageScore = Math.round(sum / totalQuizzes);
          }
          // merge into personal_stats so frontend still reads student.personal_stats
          student.personal_stats = Object.assign({}, student.personal_stats || {}, {
            totalQuizzes,
            averageScore
          });
        } else {
          console.warn('Failed to compute quiz stats for profile:', attemptsErr);
        }
      } catch (e) {
        console.warn('Error computing quiz stats:', e);
      }

      return res.status(200).json({ student: student as Student });

    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle PUT/PATCH request - Update profile
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        console.error('❌ No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      console.log('🔍 Verifying token...');

      // Verify token and get user
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        console.error('❌ Invalid token:', authError);
        return res.status(401).json({ error: 'Invalid token' });
      }

      console.log(`✅ User verified: ${user.id}`);

      // Get update data from request body
      const { name } = req.body;

      if (!name || !name.trim()) {
        console.error('❌ Invalid name provided');
        return res.status(400).json({ error: 'Name is required' });
      }

      console.log(`💾 Updating student name to: ${name}`);

      // Update student data
      const { data: student, error: updateError } = await supabaseAdmin
        .from('students')
        .update({ name: name.trim() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      console.log('✅ Profile updated successfully');
      return res.status(200).json({ student: student as Student });

    } catch (error) {
      console.error('❌ Profile update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  console.warn(`⚠️ Method not allowed: ${req.method}`);
  return res.status(405).json({ error: 'Method not allowed' });
}