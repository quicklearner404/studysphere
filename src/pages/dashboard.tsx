import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<{ greeting: string; points: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('supabase_token');
    
    // If no token, redirect to login
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch dashboard data
    fetch('/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((r) => {
        if (!r.ok) {
          // Token is invalid, clear and redirect
          localStorage.removeItem('supabase_token');
          router.push('/');
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then((data) => {
        setData(data);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('supabase_token');
        router.push('/');
      });
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fff'
      }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <main style={{ 
      maxWidth: 640, 
      margin: '40px auto', 
      padding: '20px',
      background: '#fff'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#000' }}>
        Dashboard
      </h1>
      {data ? (
        <div style={{
          padding: '30px',
          background: '#f9f9f9',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#333' }}>
            {data.greeting}
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#000' }}>
            Your points: {data.points}
          </p>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </main>
  );
}