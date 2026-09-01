import { supabase } from './supabase';
import { Message, Garden } from './database';

export const subscribeToMessages = (onMessage: (message: Message) => void) => {
  const channel = supabase.channel('messages-insert-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToGarden = (onUpdate: (garden: Garden) => void) => {
  const channel = supabase.channel('garden-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'garden' },
      (payload) => {
        onUpdate(payload.new as Garden);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
