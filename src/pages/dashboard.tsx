// src/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { ChatBubbleLeftEllipsisIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface DashboardData {
  greeting: string;
  points: number;
  studentName?: string;
}

interface DiscussionPreview {
  id: string;
  title: string;
  body?: string;
  created_at?: string;
  author?: { name?: string };
  discussion_answers?: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentQuestions, setRecentQuestions] = useState<DiscussionPreview[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      const token = session.access_token;

      try {
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        const dashboardData = await response.json();
        setData(dashboardData);
        // fetch recent discussions for dashboard preview
        try {
          const resp = await fetch('/api/discussions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resp.ok) {
            const all = await resp.json();
            // take 5 most recent by created_at desc
            const sorted = (all || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setRecentQuestions(sorted.slice(0, 5));
          }
        } catch (e) {
          console.error('Failed to fetch recent discussions', e);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        await supabase.auth.signOut();
        router.push('/login');
      }
    };

    fetchDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-800 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout studentName={data?.studentName}>
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-black mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-600">
              {data?.greeting || "Here's your learning progress."}
            </p>
          </motion.div>

          {/* Main Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Study Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/study-sessions')}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-600 font-semibold">Study Sessions</span>
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-medium mb-1">Join or Create Sessions</h3>
              <p className="text-sm text-gray-500">Collaborate with peers</p>
            </motion.div>

            {/* Create Session */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/study-sessions/create')}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-600 font-semibold">Create Session</span>
                <span className="text-2xl">�</span>
              </div>
              <h3 className="text-lg font-medium mb-1">Host a Study Session</h3>
              <p className="text-sm text-gray-500">Start collaborating</p>
            </motion.div>

            {/* Your Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-600 font-semibold">Your Points</span>
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{data?.points || 0}</h3>
              <p className="text-sm text-gray-500">Keep learning to earn more!</p>
            </motion.div>

            {/* Current Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-600 font-semibold">Current Streak</span>
                <span className="text-2xl">🔥</span>
              </div>
              <h3 className="text-4xl font-bold text-black mb-2">
                7 days
              </h3>
              <p className="text-sm text-gray-600">
                Don't break the chain!
              </p>
            </motion.div>

            {/* Leaderboard Rank */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-600 font-semibold">Leaderboard Rank</span>
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-4xl font-bold text-black mb-2">
                #4
              </h3>
              <p className="text-sm text-gray-600">
                Out of 150 students
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">
                +2% from last week
              </p>
            </motion.div>

            {/* Quizzes Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-600 font-semibold">Quizzes Completed</span>
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-4xl font-bold text-black mb-2">
                24
              </h3>
              <p className="text-sm text-gray-600">
                This month
              </p>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Recent Questions</h3>
                <button className="text-gray-600 hover:text-black font-semibold text-sm transition">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentQuestions.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                    No recent questions. Be the first to ask one in Discussions!
                  </div>
                ) : (
                  recentQuestions.map((q) => (
                    <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-semibold text-black flex-1 pr-2">
                          <Link href={`/discussion/${q.id}`} className="hover:underline">
                            {q.title}
                          </Link>
                        </h4>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold whitespace-nowrap">
                          {q.discussion_answers?.length ?? 0} answers
                        </span>
                      </div>
                      {q.body ? (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{q.body}</p>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{q.author?.name ?? 'Unknown'} • {q.created_at ? new Date(q.created_at).toLocaleString() : ''}</span>
                        <div className="flex gap-2 items-center">
                          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">{q.discussion_answers?.length ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Upcoming Sessions</h3>
                <button className="text-gray-600 hover:text-black font-semibold text-sm transition">
                  View All
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-black">
                    Calculus Study Group
                  </h4>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                    Tomorrow
                  </span>
                </div>
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold mb-3">
                  Mathematics
                </span>
                <p className="text-sm text-gray-600 mb-3">
                  Collaborative session focusing on limits and derivatives
                </p>
                <div className="text-sm text-gray-600 mb-2">
                  🕐 2:00 PM - 4:00 PM
                </div>
                <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-gray-600" />
                  <span>Already 12 participants</span>
                </div>
                <button className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition">
                  Join Session
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}