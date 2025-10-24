import Link from 'next/link';

export function PomodoroButton({ sessionId }: { sessionId: string }) {
  return (
    <Link
      href={`/pomodoro?study_session_id=${sessionId}`}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-flex items-center"
    >
      <span className="mr-2">⏱️</span>
      Start Pomodoro Timer
    </Link>
  );
}