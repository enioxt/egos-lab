import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  avatarUrl: string | null;
  username: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    avatarUrl: null,
    username: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState({
        user,
        session,
        loading: false,
        avatarUrl: user?.user_metadata?.avatar_url ?? null,
        username: user?.user_metadata?.user_name ?? user?.user_metadata?.preferred_username ?? null,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const user = session?.user ?? null;
        setState({
          user,
          session,
          loading: false,
          avatarUrl: user?.user_metadata?.avatar_url ?? null,
          username: user?.user_metadata?.user_name ?? user?.user_metadata?.preferred_username ?? null,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGitHub = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('GitHub login error:', error.message);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
  }, []);

  return {
    ...state,
    signInWithGitHub,
    signOut,
    isAuthenticated: !!state.user,
  };
}
