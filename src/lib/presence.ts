import { supabase } from './supabase';

export const createPresenceChannel = (channelKey: string, userId: string, displayName: string) => {
  const channel = supabase.channel(channelKey, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  return {
    subscribe: (onSubscribeCallback?: (status: string, err?: Error) => void) => {
      channel.subscribe(onSubscribeCallback);
    },
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
    trackPresence: async () => {
      try {
        await channel.track({
          userId,
          displayName,
          onlineAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error tracking presence:', error);
      }
    },
    onSync: (callback: () => void) => {
      channel.on('presence', { event: 'sync' }, callback);
    },
    onJoin: (callback: (key: string, newPresences: any[]) => void) => {
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        callback(key, newPresences);
      });
    },
    onLeave: (callback: (key: string, leftPresences: any[]) => void) => {
      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        callback(key, leftPresences);
      });
    },
    broadcastTyping: async (isTyping: boolean) => {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId, isTyping },
        });
      } catch (error) {
        console.error('Error broadcasting typing:', error);
      }
    },
    onTyping: (callback: (payload: { userId: string, isTyping: boolean }) => void) => {
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        callback(payload);
      });
    },
    channel,
  };
};
