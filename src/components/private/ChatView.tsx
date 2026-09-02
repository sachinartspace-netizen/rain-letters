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

const ChatView: React.FC = () => {
  const { messages, isLoading, sendMessage } = useMessages();
  const { user } = useAuthContext();
  
  const myNickname = getNicknameFromEmail(user?.email || '');
  const partnerNick = getPartnerNickname(user?.email || '');

  const { otherUserName, isOtherTyping, sendTypingStatus } = usePresence(user?.id, myNickname);
  const { rainIntensity, setRainIntensity } = useWeather();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayTypingName = (otherUserName && otherUserName !== 'Unknown' && otherUserName !== 'User' && otherUserName !== 'Anonymous')
    ? (otherUserName === 'Pratima' ? 'Tima' : otherUserName === 'Sachin' ? 'Sapy' : otherUserName)
    : partnerNick;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

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
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            No messages yet. Say something... 🌧
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={Boolean(msg.sender_id === user?.id || (user?.email && msg.sender_email.toLowerCase() === user.email.toLowerCase()))}
            />
          ))
        )}
        
        <AnimatePresence>
          {isOtherTyping && (
            <TypingIndicator name={displayTypingName} isTyping={true} />
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
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
