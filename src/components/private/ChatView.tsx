import React, { useState, useEffect, useRef } from 'react';
import useMessages from '../../hooks/useMessages';
import { useAuthContext } from '../../contexts/AuthContext';
import usePresence from '../../hooks/usePresence';
import { useWeather } from '../../contexts/WeatherContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { AnimatePresence } from 'framer-motion';
import ThemedLoader from '../layout/ThemedLoader';
import { getNicknameFromEmail, getPartnerNickname } from '../../lib/auth';

const formatMessageDateHeader = (dateStr: string): string => {
  try {
    const messageDate = new Date(dateStr);
    if (isNaN(messageDate.getTime())) return '';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(messageDate, today)) {
      return 'Today';
    }
    if (isSameDay(messageDate, yesterday)) {
      return 'Yesterday';
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const day = messageDate.getDate();
    const month = months[messageDate.getMonth()];
    const year = messageDate.getFullYear();

    if (year === today.getFullYear()) {
      return `${day} ${month}`;
    }
    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
};

const ChatView: React.FC = () => {
  const { messages, isLoading, sendMessage } = useMessages();
  const { user } = useAuthContext();
  
  const myNickname = getNicknameFromEmail(user?.email || '');
  const partnerNick = getPartnerNickname(user?.email || '');

  const { otherUserName, isOtherTyping, sendTypingStatus } = usePresence(user?.id, myNickname);
  const { rainIntensity, setRainIntensity } = useWeather();
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayTypingName = (otherUserName && otherUserName !== 'Unknown' && otherUserName !== 'User' && otherUserName !== 'Anonymous')
    ? (otherUserName === 'Pratima' ? 'Tima' : otherUserName === 'Sachin' ? 'Sapy' : otherUserName)
    : partnerNick;

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Ensure scroll is pinned to the bottom on initial load, page open, and on any message change
  useEffect(() => {
    scrollToBottom('auto');
    const rAF = requestAnimationFrame(() => scrollToBottom('auto'));
    const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
    const timer2 = setTimeout(() => scrollToBottom('smooth'), 200);

    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages.length, isOtherTyping, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTypingStatus(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText('');
    sendTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    await sendMessage(textToSend);
    scrollToBottom('smooth');
    
    // Briefly increase rain intensity
    setRainIntensity(Math.min(rainIntensity + 0.3, 1));
    setTimeout(() => {
      setRainIntensity(Math.max(rainIntensity - 0.3, 0.1));
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return <ThemedLoader />;
  }

  return (
    <div className="chat-view">
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            No messages yet. Say something... 🌧
          </div>
        ) : (
          messages.map((msg, index) => {
            const currentHeader = formatMessageDateHeader(msg.created_at);
            const prevHeader = index > 0 ? formatMessageDateHeader(messages[index - 1].created_at) : null;
            const showDateDivider = currentHeader && currentHeader !== prevHeader;

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="chat-date-divider">
                    <span className="chat-date-badge">{currentHeader}</span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isOwn={Boolean(msg.sender_id === user?.id || (user?.email && msg.sender_email.toLowerCase() === user.email.toLowerCase()))}
                />
              </React.Fragment>
            );
          })
        )}
        
        <AnimatePresence>
          {isOtherTyping && (
            <TypingIndicator name={displayTypingName} isTyping={true} />
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} style={{ height: '1px', flexShrink: 0 }} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input">
          <input
            className="chat-input__field"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            aria-label="Type a message"
          />
          <button className="chat-input__send" onClick={handleSend} title="Send">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
