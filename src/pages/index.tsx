import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router]);

  // Show loading while checking session
  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff'
      }}>
        <div style={{ fontSize: '1.2rem', color: '#999' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 20% 50%, rgba(0,0,0,0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.02) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#000',
          letterSpacing: '-1px'
        }}>
          StudySphere
        </h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/login')}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: '#000',
              border: '2px solid #000',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/register')}
            style={{
              padding: '10px 24px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            Sign Up
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 40px',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            color: '#000',
            marginBottom: '24px',
            letterSpacing: '-3px',
            lineHeight: '1.1'
          }}>
            Track Your Academic
            <br />
            Journey with Ease
          </h1>
          <p style={{
            fontSize: '1.3rem',
            color: '#666',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            StudySphere helps students manage their points, track progress, and achieve their academic goals efficiently.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/register')}
            style={{
              padding: '18px 48px',
              fontSize: '1.2rem',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            Get Started Free
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
            marginTop: '100px'
          }}
        >
          {[
            {
              title: '📊 Track Points',
              description: 'Monitor your academic points and progress in real-time'
            },
            {
              title: '🎯 Set Goals',
              description: 'Define and achieve your academic milestones'
            },
            {
              title: '📈 View Analytics',
              description: 'Get insights into your performance and growth'
            },
            {
              title: '🔒 Secure & Private',
              description: 'Your data is protected with enterprise-grade security'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5 }}
              style={{
                padding: '40px 30px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                textAlign: 'left'
              }}
            >
              <h3 style={{
                fontSize: '1.5rem',
                marginBottom: '12px',
                color: '#000',
                fontWeight: 700
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.6'
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            marginTop: '120px',
            padding: '60px',
            background: '#000',
            borderRadius: '24px',
            color: '#fff'
          }}
        >
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '20px'
          }}>
            Ready to Transform Your Studies?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '30px',
            opacity: 0.9
          }}>
            Join thousands of students already using StudySphere
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/register')}
            style={{
              padding: '16px 40px',
              fontSize: '1.1rem',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Create Your Account
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        fontSize: '0.9rem'
      }}>
        <p>© 2025 StudySphere. All rights reserved.</p>
      </footer>
    </div>
  );
}