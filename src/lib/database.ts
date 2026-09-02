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

export const fetchMessages = async (limit = 500): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
  return (data || []) as Message[];
};

export const sendMessage = async (
  senderId: string, 
  senderEmail: string, 
  senderName: string, 
  message: string
): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id: senderId,
        sender_email: senderEmail,
        sender_name: senderName,
        message: message
      }
    ])
    .select('*')
    .single();
    
  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
  return data as Message | null;
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
