import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const [data, setData] = useState<{ greeting: string; points: number } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <ProtectedRoute>
      <main style={{ maxWidth: 640, margin: '40px auto' }}>
        <h1>Dashboard</h1>
        {data ? (
          <div>
            <p>{data.greeting}</p>
            <p>Your points: {data.points}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </ProtectedRoute>
  );
}


