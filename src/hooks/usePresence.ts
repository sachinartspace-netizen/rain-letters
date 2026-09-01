import { useState, useEffect, useCallback, useRef } from 'react';
import { createPresenceChannel } from '../lib/presence';

export default function usePresence(userId: string | undefined, displayName: string | undefined) {
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [bothOnline, setBothOnline] = useState(false);
  const [otherJustArrived, setOtherJustArrived] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId || !displayName) return;

    let mounted = true;

    try {
      const channelInstance = createPresenceChannel('global-presence', userId, displayName);
      channelRef.current = channelInstance;

      const handlePresences = (presences: any) => {
        if (!mounted || !presences) return;
        try {
          const otherUser = Object.values(presences).flat().find((p: any) => p && p.userId !== userId) as any;
          
          const wasOtherOnline = isOtherOnline;
          const isNowOnline = !!otherUser;
          
          setIsOtherOnline(isNowOnline);
          if (otherUser && otherUser.displayName) {
            setOtherUserName(otherUser.displayName);
          }
          setBothOnline(isNowOnline);

          if (!wasOtherOnline && isNowOnline) {
            setOtherJustArrived(true);
            setTimeout(() => {
              if (mounted) setOtherJustArrived(false);
            }, 5000);
          }
        } catch (e) {
          console.warn('Presence handling warning:', e);
        }
      };

      channelInstance.onSync(() => {
        try {
          const state = channelInstance.channel?.presenceState();
          handlePresences(state);
        } catch {}
      });

      channelInstance.onJoin((_key, _newPresences) => {
        try {
          const state = channelInstance.channel?.presenceState();
          handlePresences(state);
        } catch {}
      });

      channelInstance.onLeave((_key, _leftPresences) => {
        try {
          const state = channelInstance.channel?.presenceState();
          handlePresences(state);
        } catch {}
      });

      channelInstance.onTyping((payload) => {
        if (payload && payload.userId !== userId && mounted) {
          setIsOtherTyping(!!payload.isTyping);
        }
      });

      channelInstance.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channelInstance.trackPresence();
        }
      });

      return () => {
        mounted = false;
        try {
          channelInstance.unsubscribe();
        } catch {}
      };
    } catch (err) {
      console.warn('Presence initialization fallback:', err);
    }
  }, [userId, displayName]);

  const sendTypingStatus = useCallback(async (isTyping: boolean) => {
    if (channelRef.current) {
      try {
        await channelRef.current.broadcastTyping(isTyping);
      } catch {}
    }
  }, []);

  return { otherUserName, isOtherOnline, isOtherTyping, bothOnline, sendTypingStatus, otherJustArrived };
}
