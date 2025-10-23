// Location: src/pages/profile.tsx

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout/MainLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PersonalStats {
  totalQuizzes?: number;
  averageScore?: number;
  studyStreak?: number;
  totalStudyTime?: number;
  totalStudySessions?: number;
  activePlans?: number;
  completedTasks?: number;
  miniGamesPlayed?: number;
  [key: string]: any;
}

interface Student {
  id: string;
  name: string;
  email: string;
  points: number;
  personal_stats: PersonalStats;
  created_at: string;
  updated_at: string;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    console.log('🔵 Component mounted');
    fetchProfile();
  }, []);

  const fetchProfile = async (): Promise<void> => {
    try {
      console.log('🔍 Fetching profile...');
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data = await response.json();
      console.log('✅ Profile fetched:', data.student);

      setStudent(data.student);
      setEditedName(data.student.name);
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!student) return;

    try {
      console.log('💾 Saving profile...');
      setSaving(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editedName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('✅ Profile updated:', data.student);

      setStudent(data.student);
      setEditing(false);
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (): void => {
    setEditedName(student?.name || '');
    setEditing(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-800 font-medium">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="border-2 border-black rounded-lg p-8 max-w-md bg-white">
            <h3 className="text-black font-bold text-xl mb-3">Error Loading Profile</h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={fetchProfile}
              className="w-full px-6 py-3 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-800 text-lg mb-4">No profile found</p>
            <button
              onClick={fetchProfile}
              className="px-6 py-3 bg-black text-white font-semibold rounded hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout studentName={student.name}>
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white border-2 border-black rounded-lg p-8 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              
              {/* Profile Info */}
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Name & Email */}
                <div>
                  {editing ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl font-bold text-black border-b-2 border-black focus:outline-none bg-transparent mb-2"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-black mb-1">{student.name}</h1>
                  )}
                  <p className="text-gray-600">{student.email}</p>
                  <p className="text-sm text-gray-500 mt-1">Member since {formatDate(student.created_at)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving || !editedName.trim()}
                      className="px-6 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 disabled:bg-gray-400 transition"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-2 bg-white text-black font-semibold rounded border-2 border-black hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Points Highlight */}
          <div className="bg-white text-black rounded-lg p-6 mb-6 shadow-sm border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Points Earned</p>
                <p className="text-4xl font-bold">{student.points.toLocaleString()}</p>
              </div>
              <div className="text-5xl">🏆</div>
            </div>
          </div>

          {/* Stats Grid - Study Activities */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Study Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Quizzes Completed</p>
                <p className="text-3xl font-bold text-black">{student.personal_stats.totalQuizzes || 0}</p>
                <p className="text-xs text-gray-500 mt-2">From class diagram: Quiz entity</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Average Score</p>
                <p className="text-3xl font-bold text-black">{student.personal_stats.averageScore || 0}%</p>
                <p className="text-xs text-gray-500 mt-2">Based on QuizAttempt records</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Study Sessions</p>
                <p className="text-3xl font-bold text-black">{student.personal_stats.totalStudySessions || 0}</p>
                <p className="text-xs text-gray-500 mt-2">From StudySession entity</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Study Streak</p>
                <p className="text-3xl font-bold text-black">{student.personal_stats.studyStreak || 0} days</p>
                <p className="text-xs text-gray-500 mt-2">Consecutive active days</p>
              </div>
            </div>
          </div>

          {/* Features Grid - From Class Diagram */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Activity Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-black">Study Planner</h3>
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-3xl font-bold text-black mb-1">{student.personal_stats.activePlans || 0}</p>
                <p className="text-sm text-gray-600">Active study plans</p>
                <p className="text-xs text-gray-500 mt-3">Feature: StudyPlanner entity</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-black">Pomodoro Timer</h3>
                  <span className="text-2xl">⏱️</span>
                </div>
                <p className="text-3xl font-bold text-black mb-1">{formatTime(student.personal_stats.totalStudyTime || 0)}</p>
                <p className="text-sm text-gray-600">Total focus time</p>
                <p className="text-xs text-gray-500 mt-3">Feature: PomodoroTimer entity</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-black">Mini Games</h3>
                  <span className="text-2xl">🎮</span>
                </div>
                <p className="text-3xl font-bold text-black mb-1">{student.personal_stats.miniGamesPlayed || 0}</p>
                <p className="text-sm text-gray-600">Games played</p>
                <p className="text-xs text-gray-500 mt-3">Feature: MiniGame entity</p>
              </div>
            </div>
          </div>

          {/* Engagement Features */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Engagement & Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-black mb-2">Video Conferences</h3>
                    <p className="text-sm text-gray-600">Join study groups and collaborate</p>
                  </div>
                  <span className="text-3xl">📹</span>
                </div>
                <p className="text-xs text-gray-500">Feature: VideoConference & AttendanceRecord entities</p>
                <button className="mt-4 w-full px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 text-sm">
                  Join Conference
                </button>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-black mb-2">Tasks Completed</h3>
                    <p className="text-sm text-gray-600">{student.personal_stats.completedTasks || 0} tasks done</p>
                  </div>
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-xs text-gray-500">Feature: PlannerItem entity with status tracking</p>
                <button className="mt-4 w-full px-4 py-2 bg-white text-black font-semibold rounded border-2 border-black hover:bg-gray-100 text-sm">
                  View Tasks
                </button>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white border-2 border-black rounded-lg p-8">
            <h2 className="text-xl font-bold text-black mb-6">Account Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">User ID</p>
                <p className="text-sm text-black font-mono break-all">{student.id}</p>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Email Address</p>
                <p className="text-sm text-black font-semibold">{student.email}</p>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Account Created</p>
                <p className="text-sm text-black font-semibold">{formatDate(student.created_at)}</p>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm text-black font-semibold">{formatDate(student.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Future Features Note */}
          <div className="mt-6 bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
            <p className="text-sm text-gray-600 italic">
              📊 Note: Statistics shown above are based on the class diagram entities (Quiz, StudySession, MiniGame, etc.). 
              These features will populate as you use the platform.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}