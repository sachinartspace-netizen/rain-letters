import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMessages, sendMessage as dbSendMessage, Message } from '../lib/database';
import { subscribeToMessages } from '../lib/realtime';
import { useAuthContext } from '../contexts/AuthContext';
import { getDisplayNameFromEmail } from '../lib/auth';

const PERMANENT_MESSAGES_KEY = 'rain-letters-permanent-history-v2';

export default function useMessages() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(PERMANENT_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, displayName } = useAuthContext();
  const broadcasterRef = useRef<((msg: Message) => void) | null>(null);

  // Helper to persist current messages array to localStorage permanently
  const persistMessages = (msgs: Message[]) => {
    try {
      localStorage.setItem(PERMANENT_MESSAGES_KEY, JSON.stringify(msgs));
    } catch {}
  };

  // Merge new messages cleanly into state without duplicates
  const mergeMessages = useCallback((incoming: Message | Message[]) => {
    setMessages((prev) => {
      const items = Array.isArray(incoming) ? incoming : [incoming];
      const prevMap = new Map(prev.map((m) => [m.id, m]));
      let changed = false;

      for (const item of items) {
        if (!item || !item.id) continue;
        const existing = prevMap.get(item.id);
        if (!existing) {
          prevMap.set(item.id, item);
          changed = true;
        }
      }

      if (!changed) return prev;

      // Sort by created_at ascending
      const mergedList = Array.from(prevMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      persistMessages(mergedList);
      return mergedList;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    // Load messages from database and merge with cache
    const syncFromDatabase = async () => {
      try {
        const data = await fetchMessages(1000);
        if (mounted && Array.isArray(data) && data.length > 0) {
          mergeMessages(data);
        }
      } catch (error) {
        console.warn('Sync messages warning:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    syncFromDatabase();

    // Set up Realtime Subscription (Postgres Changes + Live Broadcast)
    let sub: { unsubscribe: () => void; broadcastMessage: (msg: Message) => void } | null = null;
    try {
      sub = subscribeToMessages((newMessage) => {
        if (mounted && newMessage) {
          mergeMessages(newMessage);
        }
      });
      broadcasterRef.current = sub.broadcastMessage;
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }

    // Background polling every 3 seconds so no message is ever missed
    const pollInterval = setInterval(() => {
      if (mounted) {
        syncFromDatabase();
      }
    }, 3000);

    // Sync immediately when user returns to tab / unlocks phone screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        syncFromDatabase();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [mergeMessages]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!user || !messageText.trim()) return;

    const senderEmail = user.email || '';
    const senderName = getDisplayNameFromEmail(senderEmail) || displayName || 'User';
    const textTrimmed = messageText.trim();

    // 1. Insert into database
    try {
      const inserted = await dbSendMessage(user.id, senderEmail, senderName, textTrimmed);
      if (inserted) {
        mergeMessages(inserted);
        // 2. Broadcast immediately over live socket (<50ms)
        if (broadcasterRef.current) {
          broadcasterRef.current(inserted);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback message object if database insert encountered network blip
      const tempMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender_id: user.id,
        sender_email: senderEmail,
        sender_name: senderName,
        message: textTrimmed,
        created_at: new Date().toISOString(),
      };
      mergeMessages(tempMsg);
      if (broadcasterRef.current) {
        broadcasterRef.current(tempMsg);
      }
    }
  }, [user, displayName, mergeMessages]);

  return { messages, isLoading, sendMessage };
}
