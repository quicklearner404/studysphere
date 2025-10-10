// src/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardData {
  greeting: string;
  points: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        setIsLoading(false);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        await supabase.auth.signOut();
        router.push('/login');
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex' }}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 40
              }}
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '280px',
                background: '#fff',
                boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
                zIndex: 50,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000' }}>StudySphere</h2>
              </div>

              <nav style={{ flex: 1 }}>
                <button
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  📊 Dashboard
                </button>
                
                <button
                  onClick={() => router.push('/profile')}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  👤 Profile
                </button>

                <button
                  onClick={() => alert('Settings coming soon!')}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  ⚙️ Settings
                </button>
              </nav>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#fee',
                  color: '#c00',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🚪 Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Top Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '10px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ☰
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#000', margin: 0 }}>Dashboard</h1>
          <div style={{ width: '40px' }} />
        </div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '30px' }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#000', marginBottom: '8px' }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '1rem', color: '#666' }}>
            {data?.greeting || "Here's your learning progress."}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Total Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>Total Points</span>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#000', marginBottom: '8px' }}>
              {data?.points || 1250}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#22c55e' }}>
              Keep learning to earn more!
            </p>
            <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
              +12% from last week
            </p>
          </motion.div>

          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>Current Streak</span>
              <span style={{ fontSize: '1.5rem' }}>🔥</span>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#000', marginBottom: '8px' }}>
              7 days
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              Don't break the chain!
            </p>
          </motion.div>

          {/* Leaderboard Rank */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>Leaderboard Rank</span>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#000', marginBottom: '8px' }}>
              #4
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              Out of 150 students
            </p>
            <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '4px' }}>
              +2% from last week
            </p>
          </motion.div>

          {/* Quizzes Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>Quizzes Completed</span>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#000', marginBottom: '8px' }}>
              24
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              This month
            </p>
          </motion.div>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {/* Recent Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#000' }}>Recent Questions</h3>
              <button style={{ 
                color: '#666', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                View All
              </button>
            </div>

            <div style={{
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#000', flex: 1 }}>
                  How do I solve quadratic equations efficiently?
                </h4>
                <span style={{
                  padding: '4px 10px',
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px'
                }}>
                  Mathematics
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>
                I'm struggling with completing the square method. Can someone explain the steps in detail?
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#999' }}>Sarah Chen • 2 hours ago</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>👍 9</span>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>💬 5 answers</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#000' }}>Upcoming Sessions</h3>
              <button style={{ 
                color: '#666', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                View All
              </button>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9f9f9',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#000' }}>
                  Calculus Study Group
                </h4>
                <span style={{
                  padding: '4px 10px',
                  background: '#dcfce7',
                  color: '#16a34a',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  Tomorrow
                </span>
              </div>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: '#e0e7ff',
                color: '#4f46e5',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '12px'
              }}>
                Mathematics
              </span>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>
                Collaborative session focusing on limits and derivatives
              </p>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                🕐 2:00 PM - 4:00 PM
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
                👥 Already 12 participants
              </div>
              <button style={{
                width: '100%',
                padding: '12px',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}>
                Join Session
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}