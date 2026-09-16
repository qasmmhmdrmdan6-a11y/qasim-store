import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Tracks the current Supabase Auth session and whether that user is an
 * admin (has a row in admin_users). Being logged in to Supabase Auth is
 * NOT sufficient by itself — admin_users membership is what RLS policies
 * actually check via is_admin(), so we mirror that check here for the UI.
 */
export function useAdminAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession(newSession: Session | null) {
      if (!active) return;
      setSession(newSession);

      if (!newSession) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', newSession.user.id)
        .maybeSingle();

      if (!active) return;
      setIsAdmin(!error && !!data);
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => loadSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      loadSession(newSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, isAdmin, isLoading };
}

export async function signInAdmin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}
