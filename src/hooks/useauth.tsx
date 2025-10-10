// src/hooks/useAuth.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(requireAuth: boolean = true): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
        } else if (requireAuth) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (requireAuth) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        if (requireAuth) {
          router.push('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requireAuth, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return { user, loading, signOut };
}