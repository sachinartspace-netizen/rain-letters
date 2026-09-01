import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getSession, isEmailAllowed, signInWithGoogle, signOut as authSignOut } from '../lib/auth';
import { getProfile, Profile } from '../lib/database';

const getDisplayNameForEmail = (email: string, fallback?: string) => {
  const normalized = (email || '').toLowerCase();
  const emailToName: Record<string, string> = {
    'pratimahansda14@gmail.com': 'Pratima',
    'pratimahansda18@gmail.com': 'Pratima',
    'praticreates@gmail.com': 'Pratima',
    'sachin.artspace@gmail.com': 'Sachin',
    'sachingupta706155@gmail.com': 'Sachin',
    'sachingupta766741@gmail.com': 'Sachin',
  };

  return emailToName[normalized] || fallback || (normalized ? normalized.split('@')[0] : '');
};

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
              const resolvedDisplayName = getDisplayNameForEmail(
                email,
                prof?.display_name || currentSession.user.user_metadata?.full_name || email.split('@')[0]
              );
              if (mounted) {
                setProfile(prof);
                setDisplayName(resolvedDisplayName);
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
            const resolvedDisplayName = getDisplayNameForEmail(
              email,
              prof?.display_name || currentSession.user.user_metadata?.full_name || email.split('@')[0]
            );
            if (mounted) {
              setProfile(prof);
              setDisplayName(resolvedDisplayName);
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

  const signOut = async () => {
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
    signOut, 
    displayName,
    authError 
  };
}
