import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMessages, sendMessage as dbSendMessage, syncLocalMessages, Message } from '../lib/database';
import { subscribeToMessages } from '../lib/realtime';
import { useAuthContext } from '../contexts/AuthContext';
import { getDisplayNameFromEmail } from '../lib/auth';

const STORAGE_KEYS = [
  'rain-letters-permanent-history-v2',
  'rain-letters-local-messages',
  'rain-letters-messages',
];

const PRIMARY_KEY = 'rain-letters-permanent-history-v2';

function getLocalMessages(): Message[] {
  const map = new Map<string, Message>();
  for (const key of STORAGE_KEYS) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          for (const m of parsed) {
            if (m && m.id && m.message) {
              map.set(m.id, m);
            }
          }
        }
      }
    } catch {}
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function useMessages() {
  const [messages, setMessages] = useState<Message[]>(() => getLocalMessages());
  const [isLoading, setIsLoading] = useState(true);
  const { user, displayName } = useAuthContext();
  const broadcasterRef = useRef<((msg: Message) => void) | null>(null);
  const hasSyncedLocalRef = useRef(false);

  // Helper to persist current messages array to localStorage permanently
  const persistMessages = (msgs: Message[]) => {
    try {
      localStorage.setItem(PRIMARY_KEY, JSON.stringify(msgs));
    } catch {}
  };

  // Merge new messages cleanly into state without duplicates
  const mergeMessages = useCallback((incoming: Message | Message[]) => {
    setMessages((prev) => {
      const items = Array.isArray(incoming) ? incoming : [incoming];
      const prevMap = new Map(prev.map((m) => [m.id, m]));
      let changed = false;

      for (const item of items) {
        if (!item || !item.id || !item.message) continue;
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

    // 1. Initial local-to-cloud sync: upload any locally stored messages from this device
    const initialSync = async () => {
      if (!hasSyncedLocalRef.current) {
        hasSyncedLocalRef.current = true;
        const cached = getLocalMessages();
        if (cached.length > 0) {
          try {
            const serverMsgs = await syncLocalMessages(cached);
            if (mounted && serverMsgs.length > 0) {
              mergeMessages(serverMsgs);
            }
          } catch (err) {
            console.warn('Initial local messages sync error:', err);
          }
        }
      }
    };

    // 2. Load latest unified messages from cloud
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

    (async () => {
      await initialSync();
      await syncFromDatabase();
    })();

    // 3. Set up Realtime Subscription (Postgres Changes + Live Broadcast)
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

    // 4. Background polling every 3 seconds so no message is ever missed
    const pollInterval = setInterval(() => {
      if (mounted) {
        syncFromDatabase();
      }
    }, 3000);

    // 5. Sync immediately when user returns to tab / unlocks phone screen
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

    try {
      const inserted = await dbSendMessage(user.id, senderEmail, senderName, textTrimmed);
      if (inserted) {
        mergeMessages(inserted);
        // Broadcast immediately over live socket (<50ms)
        if (broadcasterRef.current) {
          broadcasterRef.current(inserted);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
