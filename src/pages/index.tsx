import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import FormInput from '@/components/FormInput';
import { loginSchema } from '@/lib/validators';

export default function HomePage() {
  const router = useRouter();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors({});
    setServerError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setErrors({});
    setIsLoading(true);
    
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((er) => (fieldErrors[er.path[0] as string] = er.message));
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(values) 
      });
      
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('supabase_token', token);
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setServerError(data.error || 'Invalid email or password');
      }
    } catch (error) {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: '100%',
          maxWidth: '450px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <h1 style={{
            fontSize: '3.5rem',
            color: '#000000',
            marginBottom: '0.5rem',
            fontWeight: 800,
            letterSpacing: '-2px'
          }}>
            StudySphere
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666',
            fontWeight: 400
          }}>
            Welcome back! Please login to continue
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            background: '#ffffff',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <form onSubmit={onSubmit}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={values.email}
                onChange={onChange}
                error={errors.email}
                placeholder="Enter your email"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ marginBottom: '30px' }}
            >
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={onChange}
                error={errors.password}
                placeholder="Enter your password"
              />
            </motion.div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '14px',
                    background: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '10px',
                    color: '#c00',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.1rem',
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              margin: '30px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            <span style={{ color: '#999', fontSize: '0.9rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
          </motion.div>

          {/* Sign up link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ textAlign: 'center' }}
          >
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.95rem' }}>
              Don't have an account?
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/register')}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                background: 'transparent',
                color: '#000',
                border: '2px solid #000',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              Create Account
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}