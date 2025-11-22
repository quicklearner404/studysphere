import React, { useState, useEffect } from 'react';
// These original imports are left untouched:
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

  // --- START OF UI CHANGES ---

  // UI for the Loading State (Updated with Tailwind classes)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  // Main Login UI with new styling (White Card on Gray Background)
  return (
    
    // Outer Container: Full screen height, light gray background, centered content
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {/* Auth Card Container: White background, large padding, rounded corners, shadow, max width */}
        
        <main className="bg-white p-12 rounded-xl shadow-xl w-full max-w-lg mx-auto">
    <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-1">
        Study Sphere
    </h1>
    <p className="text-xl font-normal text-gray-600 text-center mb-10">
        Welcome Back
    </p>
    <form onSubmit={onSubmit} className="space-y-6">
              
                
                {/* NOTE: FormInput component needs to handle its own input styling (p-4, border-gray-400) 
                         to fully match the screenshot, but since we cannot modify it here, we rely on the parent component's spacing. 
                         The space-y-6 class provides necessary vertical separation. */}
                <FormInput label="Email Address" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} />
                <FormInput label="Password" name="password" type="password" value={values.password} onChange={onChange} error={errors.password} />

                {serverError && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm mb-4">
                        {serverError}
                    </div>
                )}

                <button 
                    type="submit" 
                    // Button styling: dark, prominent, full width
                    className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150 mt-6"
                >
                    Login
                </button>
            </form>
            <p className="mt-8 text-center text-sm text-gray-600">
                Don't have an account? <a href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition duration-150">Sign up</a>
            </p>
        </main>
    </div>
  );
}