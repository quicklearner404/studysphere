import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface PomodoroStatus {
  user_id: string;
  user_name: string;
  status: 'focus' | 'break' | 'long-break' | 'idle';
  time_left?: number;
}

interface Props {
  studySessionId: string;
  userId: string;
  userName: string;
}

export default function PomodoroStatusIndicator({ studySessionId, userId, userName }: Props) {
  const [participantStatuses, setParticipantStatuses] = useState<PomodoroStatus[]>([]);

  // Subscribe to status changes
  useEffect(() => {
    // Create a subscription to pomodoro_status table
    const channel = supabase
      .channel(`pomodoro-status-${studySessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_status',
          filter: `study_session_id=eq.${studySessionId}`
        },
        (payload) => {
          // Update status list when changes occur
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setParticipantStatuses(prev => {
              const newStatus = payload.new as PomodoroStatus;
              const existing = prev.findIndex(s => s.user_id === newStatus.user_id);
              if (existing >= 0) {
                return [
                  ...prev.slice(0, existing),
                  newStatus,
                  ...prev.slice(existing + 1)
                ];
              }
              return [...prev, newStatus];
            });
          } else if (payload.eventType === 'DELETE') {
            setParticipantStatuses(prev => 
              prev.filter(s => s.user_id !== (payload.old as PomodoroStatus).user_id)
            );
          }
        }
      )
      .subscribe();

    // Fetch initial statuses
    const fetchStatuses = async () => {
      const { data } = await supabase
        .from('pomodoro_status')
        .select('*')
        .eq('study_session_id', studySessionId);
      
      if (data) {
        setParticipantStatuses(data as PomodoroStatus[]);
      }
    };

    fetchStatuses();

    return () => {
      channel.unsubscribe();
    };
  }, [studySessionId]);

  const getStatusEmoji = (status: PomodoroStatus['status']) => {
    switch (status) {
      case 'focus': return '🎯';
      case 'break': return '☕';
      case 'long-break': return '🌟';
      default: return '⭕';
    }
  };

  const getStatusText = (status: PomodoroStatus) => {
    if (status.time_left && status.status !== 'idle') {
      const minutes = Math.floor(status.time_left / 60);
      const seconds = status.time_left % 60;
      return `${status.status} (${minutes}:${seconds.toString().padStart(2, '0')})`;
    }
    return status.status;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Pomodoro Status</h3>
      <div className="space-y-2">
        {participantStatuses.map((status) => (
          <div 
            key={status.user_id}
            className={`flex items-center p-2 rounded ${
              status.status === 'focus' ? 'bg-red-50' :
              status.status === 'break' ? 'bg-green-50' :
              status.status === 'long-break' ? 'bg-blue-50' :
              'bg-gray-50'
            }`}
          >
            <span className="mr-2 text-lg">{getStatusEmoji(status.status)}</span>
            <div>
              <p className="font-medium">
                {status.user_name} 
                {status.user_id === userId && ' (You)'}
              </p>
              <p className="text-sm text-gray-600">
                {getStatusText(status)}
              </p>
            </div>
          </div>
        ))}
        {participantStatuses.length === 0 && (
          <p className="text-gray-500 text-sm">
            No active Pomodoro sessions
          </p>
        )}
      </div>
    </div>
  );
}