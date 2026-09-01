import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getSession, isEmailAllowed, signInWithGoogle, signOut as authSignOut } from '../lib/auth';
import { getProfile, Profile } from '../lib/database';

const DEMO_USER_KEY = 'rain-letters-demo-user';

export interface DemoUser {
  id: string;
  email: string;
  display_name: string;
}

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check for local demo user session first
        const savedDemoUser = localStorage.getItem(DEMO_USER_KEY);
        if (savedDemoUser) {
          try {
            const parsedDemo: DemoUser = JSON.parse(savedDemoUser);
            if (mounted) {
              const fakeUser = { id: parsedDemo.id, email: parsedDemo.email } as User;
              setUser(fakeUser);
              setIsAllowed(true);
              setDisplayName(parsedDemo.display_name);
              setProfile({
                id: parsedDemo.id,
                email: parsedDemo.email,
                display_name: parsedDemo.display_name,
                avatar_url: null,
                created_at: new Date().toISOString(),
                last_seen: new Date().toISOString(),
              });
              setIsLoading(false);
              return;
            }
          } catch {
            localStorage.removeItem(DEMO_USER_KEY);
          }
        }

        // Standard Supabase session check
        const { session: currentSession } = await getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          
          if (currentSession?.user) {
            const email = currentSession.user.email || '';
            const allowed = isEmailAllowed(email);
            setIsAllowed(allowed);
            
            if (allowed) {
              const prof = await getProfile(currentSession.user.id);
              if (mounted) {
                setProfile(prof);
                setDisplayName(prof?.display_name || currentSession.user.user_metadata?.full_name || email.split('@')[0]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession?.user) {
          const email = currentSession.user.email || '';
          const allowed = isEmailAllowed(email);
          setIsAllowed(allowed);
          
          if (allowed) {
            const prof = await getProfile(currentSession.user.id);
            if (mounted) {
              setProfile(prof);
              setDisplayName(prof?.display_name || currentSession.user.user_metadata?.full_name || email.split('@')[0]);
            }
          } else {
            setProfile(null);
            setDisplayName('');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAllowed(false);
        setProfile(null);
        setDisplayName('');
        localStorage.removeItem(DEMO_USER_KEY);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Google Auth error, falling back to option guidance:', err);
      setAuthError(err?.message || 'Google Sign In failed. Check Supabase/Google configuration.');
      throw err;
    }
  };

  const signInAsDemo = (email: string, name: string) => {
    const demoUser: DemoUser = {
      id: `demo-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email,
      display_name: name,
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser({ id: demoUser.id, email: demoUser.email } as User);
    setIsAllowed(true);
    setDisplayName(demoUser.display_name);
    setProfile({
      id: demoUser.id,
      email: demoUser.email,
      display_name: demoUser.display_name,
      avatar_url: null,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    try {
      await authSignOut();
    } catch {
      // Ignore if session wasn't active
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAllowed(false);
    setDisplayName('');
  };

  return { 
    user, 
    session, 
    profile, 
    isLoading, 
    isAuthenticated: !!user, 
    isAllowed, 
    signIn, 
    signInAsDemo, 
    signOut, 
    displayName,
    authError 
  };
}
