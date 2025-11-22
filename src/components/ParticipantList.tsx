import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '@/types/studySession';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface ParticipantListProps {
  participants: (AttendanceRecord & {
    student?: { name?: string; email?: string } | null;
  })[];
  currentUser: User | null;
}

interface StudentInfo {
  id: string;
  name?: string;
  email?: string;
}

export default function ParticipantList({ participants, currentUser }: ParticipantListProps) {
  const [studentInfo, setStudentInfo] = useState<Record<string, StudentInfo>>({});

  // Fetch student names if not resolved
  useEffect(() => {
    const fetchStudentNames = async () => {
      // Safe check for participants
      if (!participants || participants.length === 0) return;

      const studentIds = Array.from(new Set(
        participants
          .map(p => p.student_id)
          .filter((id): id is string => Boolean(id)) // Type guard to ensure string[]
      ));

      // Filter out IDs we already have info for
      const missingIds = studentIds.filter(id => 
        !studentInfo[id] && 
        (!participants.find(p => p.student_id === id)?.student?.name)
      );

      if (missingIds.length > 0) {
        try {
          const { data: students, error } = await supabase
            .from('students')
            .select('id, name, email')
            .in('id', missingIds);

          if (!error && students) {
            const newStudentInfo: Record<string, StudentInfo> = {};
            students.forEach(student => {
              if (student.id) {
                newStudentInfo[student.id] = {
                  id: student.id,
                  name: student.name || undefined,
                  email: student.email || undefined
                };
              }
            });
            setStudentInfo(prev => ({ ...prev, ...newStudentInfo }));
          }
        } catch (error) {
          console.error('Error fetching student names:', error);
        }
      }
    };

    fetchStudentNames();
  }, [participants, studentInfo]);

  const getParticipantName = (record: AttendanceRecord & { student?: { name?: string; email?: string } | null }) => {
    if (!record.student_id) return 'Unknown User';

    // Priority 1: Use resolved student name from backend API
    if (record.student?.name) {
      return record.student.name;
    }

    // Priority 2: Use frontend-resolved student name
    if (studentInfo[record.student_id]?.name) {
      return studentInfo[record.student_id].name;
    }
    
    // Priority 3: Use email username for current user
    if (record.student_id === currentUser?.id && currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    
    // Priority 4: Try to get from student email (backend or frontend)
    if (record.student?.email) {
      return record.student.email.split('@')[0];
    }

    if (studentInfo[record.student_id]?.email) {
      return studentInfo[record.student_id].email?.split('@')[0] || 'Unknown';
    }
    
    // Fallback: Show formatted user ID
    return `User ${record.student_id.slice(0, 8)}`;
  };

  // Safe check for participants
  if (!participants) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Participants (0)</h2>
        <p className="text-gray-500 text-center py-4">No participants data</p>
      </div>
    );
  }

  const activeParticipants = participants.filter(record => !record.leave_time);

  return (
    <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Participants ({activeParticipants.length})</h2>
      <div className="space-y-3">
        {activeParticipants.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No participants yet</p>
        ) : (
          activeParticipants.map((record, index) => {
            if (!record.student_id) return null; // Skip records without student_id
            
            return (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <span className="font-medium">{getParticipantName(record)}</span>
                    {record.student_id === currentUser?.id && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">You</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Joined {record.join_time ? new Date(record.join_time).toLocaleTimeString() : 'Unknown time'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}