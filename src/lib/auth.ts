import { supabase } from './supabase';
import { allowedEmails } from '../data/compliments';

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined
    }
  });
  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  return data;
};

export const getUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting user from session:', error);
    throw error;
  }
  return session?.user || null;
};

export const isEmailAllowed = (email: string): boolean => {
  if (!email) return false;
  return allowedEmails.map(e => e.toLowerCase()).includes(email.toLowerCase());
};

export const getDisplayNameFromEmail = (email: string): string => {
  if (!email) return 'User';
  const lower = email.toLowerCase().trim();
  if ([
    'pratimahansda14@gmail.com',
    'pratimahansda18@gmail.com',
    'praticreates@gmail.com',
  ].includes(lower)) {
    return 'Pratima';
  }
  if ([
    'sachin.artspace@gmail.com',
    'sachingupta706155@gmail.com',
    'sachingupta766741@gmail.com',
  ].includes(lower)) {
    return 'Sachin';
  }
  return lower.split('@')[0] || 'User';
};
