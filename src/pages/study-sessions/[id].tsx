import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import MainLayout from '@/components/Layout/MainLayout';
import { StudySession, VideoConference, AttendanceRecord } from '@/types/studySession';
import { User } from '@supabase/supabase-js';
import ParticipantList from '@/components/ParticipantList';
import EditSessionForm from '@/components/EditSessionForm';

interface SessionWithDetails extends StudySession {
  host?: { name?: string } | null;
  video_conferences?: VideoConference[];
  attendance_records?: AttendanceRecord[];
}

export default function StudySessionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'not-joined' | 'joined'>('not-joined');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // For loading state

  useEffect(() => {
    if (id) {
      fetchSessionDetails();
    }
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession) {
        router.push('/login');
        return;
      }

      setCurrentUser(authSession.user);

      const response = await fetch(`/api/study-sessions/${id}`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }

      const data = await response.json();
      setSession(data);

      // Check if user is already in the session
      const isJoined = data.attendance_records.some(
        (record: AttendanceRecord) => 
          record.student_id === authSession.user.id && 
          !record.leave_time
      );
      setUserStatus(isJoined ? 'joined' : 'not-joined');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSession = async (updatedData: Partial<StudySession>) => {
    try {
      setIsUpdating(true);
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/study-sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const updatedSession = await response.json();
      setSession(updatedSession);
      setIsEditing(false);
      alert('Session updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleJoin = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/study-sessions/${id}?action=join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      setUserStatus('joined');
      fetchSessionDetails(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    }
  };

  const handleLeave = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/study-sessions/${id}?action=leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to leave session');
      }

      setUserStatus('not-joined');
      fetchSessionDetails(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave session');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-800 font-medium">Loading session details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !session) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-500">
            {error || 'Session not found'}
          </div>
        </div>
      </MainLayout>
    );
  }

  const isHost = currentUser?.id === session.host_id;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
              <p className="text-gray-600">Hosted by {session.host?.name ?? (session.host_id ? session.host_id.slice(0, 8) : 'Unknown')}</p>
            </div>
            <div className="flex gap-2">
              {/* Add Edit button for host */}
              {isHost && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Edit Session
                </button>
              )}
              
              {userStatus === 'not-joined' ? (
                <button
                  onClick={handleJoin}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Join Session
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                >
                  Leave Session
                </button>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <EditSessionForm
            session={session}
            onUpdate={handleUpdateSession}
            onCancel={() => setIsEditing(false)}
            isLoading={isUpdating}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Video Conference</h2>
                {userStatus === 'joined' ? (
                  <div className="text-center">
                    <button
                      onClick={async () => {
                        try {
                          const { data: { session: authSession } } = await supabase.auth.getSession();
                          if (!authSession) return router.push('/login');

                          // Record attendance when video meeting begins
                          await supabase
                            .from('attendance_records')
                            .upsert(
                              {
                                session_id: session.id,
                                student_id: authSession.user.id,
                                join_time: new Date().toISOString(),
                                leave_time: null
                              },
                              {
                                onConflict: 'session_id,student_id'
                              }
                            );

                          // Open Jitsi call
                          const roomName = `session-${session.id}`;
                          const userDisplayName = currentUser?.email?.split('@')[0] || 'Guest';
                          const url = `https://meet.jit.si/${roomName}#userInfo.displayName=${encodeURIComponent(userDisplayName)}`;
                          window.open(url, '_blank');
                        } catch (err) {
                          console.error("Error starting meeting attendance", err);
                          setError("Failed to join video call");
                        }
                      }}
                      className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 mb-4"
                    >
                      Join Video Call
                    </button>
                    <p className="text-sm text-gray-500">
                      Click to open video call in a new tab. Your name will be pre-filled.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Join the session to access video conference
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm mb-6">
                <h2 className="text-xl font-bold mb-4">Session Info</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Start Time</div>
                    <div>{new Date(session.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</div>
                  </div>
                  {session.end_time && (
                    <div>
                      <div className="text-sm text-gray-500">End Time</div>
                      <div>{new Date(session.end_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="capitalize">{session.status}</div>
                  </div>
                  {session.max_participants && (
                    <div>
                      <div className="text-sm text-gray-500">Max Participants</div>
                      <div>{session.max_participants}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Replace the manual participants list with the component */}
              <ParticipantList 
                participants={session.attendance_records || []}
                currentUser={currentUser}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}