import { supabase } from './supabase';
import { Message, Garden } from './database';

export const subscribeToMessages = (onMessage: (message: Message) => void) => {
  const channel = supabase.channel('rain-messages-live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new) {
          onMessage(payload.new as Message);
        }
      }
    )
    .on(
      'broadcast',
      { event: 'new-message' },
      ({ payload }) => {
        if (payload) {
          onMessage(payload as Message);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.warn('Realtime message channel status:', status, err);
      }
    });

  const broadcastMessage = (msg: Message) => {
    try {
      channel.send({
        type: 'broadcast',
        event: 'new-message',
        payload: msg,
      }).catch(() => {});
    } catch {}
  };

  return {
    unsubscribe: () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    },
    broadcastMessage,
  };
};

export const subscribeToGarden = (onUpdate: (garden: Garden) => void) => {
  const channel = supabase.channel('garden-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'garden' },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as Garden);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
};
