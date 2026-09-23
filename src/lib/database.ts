import { supabase } from './supabase';

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  sender_email: string;
  sender_name: string;
  message: string;
}

export interface Garden {
  id: string;
  growth: number;
  total_minutes: number;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  last_seen: string;
  created_at: string;
}

const PUBLIC_MESSAGES_URL = 'https://wdjfcqdclqnnojjzqyao.supabase.co/storage/v1/object/public/chat_data/messages.json';

export const fetchMessages = async (limit = 1000): Promise<Message[]> => {
  // 1. Primary: Serverless API endpoint
  try {
    const res = await fetch('/api/messages?t=' + Date.now());
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.messages)) {
        return json.messages.slice(-limit);
      }
    }
  } catch (err) {
    console.warn('API /api/messages fetch failed, trying direct public storage:', err);
  }

  // 2. Secondary fallback: Direct Supabase Storage download
  try {
    const res = await fetch(`${PUBLIC_MESSAGES_URL}?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) {
        return json.slice(-limit);
      }
    }
  } catch (err) {
    console.warn('Direct storage fetch failed, trying supabase client table:', err);
  }

  // 3. Tertiary fallback: Supabase postgres table if created
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (!error && data) {
      return data as Message[];
    }
  } catch {
    // ignore
  }

  return [];
};

export const sendMessage = async (
  senderId: string, 
  senderEmail: string, 
  senderName: string, 
  message: string
): Promise<Message> => {
  const newMsg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender_id: senderId,
    sender_email: senderEmail,
    sender_name: senderName,
    message: message,
    created_at: new Date().toISOString(),
  };

  // 1. Post to /api/messages
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg }),
    });
    if (res.ok) {
      return newMsg;
    }
  } catch (error) {
    console.warn('Failed to send message to /api/messages:', error);
  }

  // 2. Fallback to Supabase postgres table if available
  try {
    await supabase
      .from('messages')
      .insert([newMsg]);
  } catch {
    // ignore
  }

  return newMsg;
};

export const syncLocalMessages = async (messages: Message[]): Promise<Message[]> => {
  if (!messages || messages.length === 0) return [];
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        return data.messages;
      }
    }
  } catch (err) {
    console.warn('Failed to sync local messages to server:', err);
  }
  return [];
};

export const getGarden = async () => {
  const { data, error } = await supabase
    .from('garden')
    .select('*')
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching garden:', error);
    throw error;
  }
  return data as Garden | null;
};

export const updateGardenGrowth = async (growth: number, totalMinutes: number) => {
  const { error } = await supabase
    .from('garden')
    .update({ growth, total_minutes: totalMinutes, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (error) {
    console.error('Error updating garden growth:', error);
    throw error;
  }
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
    throw error;
  }
  return data as Profile | null;
};

export const updateLastSeen = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId);
    
  if (error) {
    console.error('Error updating last seen:', error);
    throw error;
  }
};

export const updatePresence = async (userId: string, online: boolean, typing: boolean) => {
  const { error } = await supabase
    .from('presence')
    .upsert([
      { id: userId, online, typing, updated_at: new Date().toISOString() }
    ], { onConflict: 'id' });
    
  if (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
};
