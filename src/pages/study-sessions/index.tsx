import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import MainLayout from '@/components/Layout/MainLayout';
import { StudySession } from '@/types/studySession';

export default function StudySessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/study-sessions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = () => {
    router.push('/study-sessions/create');
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Study Sessions</h1>
          <button
            onClick={handleCreateSession}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Session
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading sessions...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No study sessions available. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/study-sessions/${session.id}`)}
              >
                <h3 className="font-semibold text-lg mb-2">{session.title}</h3>
                {session.description && (
                  <p className="text-gray-600 mb-2">{session.description}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    {new Date(session.start_time).toLocaleDateString()} at{' '}
                    {new Date(session.start_time).toLocaleTimeString()}
                  </span>
                  <span className="capitalize">{session.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}