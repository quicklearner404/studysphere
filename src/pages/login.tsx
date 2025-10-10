import React, { useState, useEffect } from 'react';
import FormInput from '@/components/FormInput';
import { loginSchema } from '@/lib/validators';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
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

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setErrors({});
    
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((er) => (fieldErrors[er.path[0] as string] = er.message));
      setErrors(fieldErrors);
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });
    
    if (error || !data.session) {
      setServerError('Invalid email or password');
      return;
    }

    router.push('/dashboard');
  }

  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ fontSize: '1.2rem', color: '#999' }}>Loading...</p>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Login</h1>
      <form onSubmit={onSubmit}>
        <FormInput label="Email" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} />
        <FormInput label="Password" name="password" type="password" value={values.password} onChange={onChange} error={errors.password} />
        {serverError && <div style={{ color: 'crimson', marginBottom: 8 }}>{serverError}</div>}
        <button type="submit" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>Login</button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an account? <a href="/register" style={{ color: '#000', fontWeight: 600 }}>Sign up</a>
      </p>
    </main>
  );
}