import React, { useState } from 'react';
import FormInput from '@/components/FormInput';
import { loginSchema } from '@/lib/validators';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

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
      setServerError('Invalid email or password');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <FormInput label="Email" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} />
        <FormInput label="Password" name="password" type="password" value={values.password} onChange={onChange} error={errors.password} />
        {serverError && <div style={{ color: 'crimson', marginBottom: 8 }}>{serverError}</div>}
        <button type="submit">Login</button>
      </form>
    </main>
  );
}