// src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigationItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
    { icon: '👤', label: 'Profile', href: '/profile', active: false },
    { icon: '⚙️', label: 'Settings', href: '/settings', active: false },
  ];

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
                {navigationItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => item.active ? null : router.push(item.href)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: item.active ? '#000' : 'transparent',
                      color: item.active ? '#fff' : '#666',
                      border: 'none',
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#000', margin: 0 }}>{title}</h1>
          <div style={{ width: '40px' }} />
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}