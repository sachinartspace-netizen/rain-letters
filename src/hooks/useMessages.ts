import { useState, useEffect, useCallback } from 'react';
import { fetchMessages, sendMessage as dbSendMessage, Message } from '../lib/database';
import { subscribeToMessages } from '../lib/realtime';
import { useAuthContext } from '../contexts/AuthContext';

const LOCAL_MESSAGES_KEY = 'rain-letters-local-messages';

export default function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, displayName } = useAuthContext();

  const getSavedLocalMessages = (): Message[] => {
    try {
      const saved = localStorage.getItem(LOCAL_MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalMessages = (msgs: Message[]) => {
    try {
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(msgs));
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    
    const loadMessages = async () => {
      try {
        const data = await fetchMessages();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setMessages(data);
          saveLocalMessages(data);
          return;
        }
      } catch (error) {
        console.warn('Supabase fetch messages warning, loading local fallback:', error);
      }

      // Fallback to local stored messages
      if (mounted) {
        setMessages(getSavedLocalMessages());
      }
      if (mounted) setIsLoading(false);
    };

    loadMessages();

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToMessages((newMessage) => {
        if (mounted) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) return prev;
            const updated = [...prev, newMessage];
            saveLocalMessages(updated);
            return updated;
          });
        }
      });
    } catch (err) {
      console.warn('Realtime messages subscription warning:', err);
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!user || !messageText.trim()) return;
    
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender_id: user.id,
      sender_email: user.email || '',
      sender_name: displayName || 'Anonymous',
      message: messageText.trim(),
      created_at: new Date().toISOString(),
    };

    // Immediately update UI
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      saveLocalMessages(updated);
      return updated;
    });

    // Attempt database insert
    try {
      await dbSendMessage(user.id, user.email || '', displayName || 'Anonymous', messageText.trim());
    } catch (error) {
      console.warn('Supabase send message fallback to local state:', error);
    }
  }, [user, displayName]);

  return { messages, isLoading, sendMessage };
}
