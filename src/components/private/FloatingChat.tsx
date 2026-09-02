import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMessages from '../../hooks/useMessages';
import { useAuthContext } from '../../contexts/AuthContext';
import usePresence from '../../hooks/usePresence';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { getNicknameFromEmail, getPartnerNickname } from '../../lib/auth';

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { messages, sendMessage } = useMessages();
  const { user } = useAuthContext();
  const prevMsgCountRef = useRef(messages.length);

  const myNickname = getNicknameFromEmail(user?.email || '');
  const partnerNick = getPartnerNickname(user?.email || '');

  const { otherUserName, isOtherTyping, sendTypingStatus } = usePresence(user?.id, myNickname);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayTypingName = (otherUserName && otherUserName !== 'Unknown' && otherUserName !== 'User' && otherUserName !== 'Anonymous')
    ? (otherUserName === 'Pratima' ? 'Tima' : otherUserName === 'Sachin' ? 'Sapy' : otherUserName)
    : partnerNick;

  // Track incoming partner messages when chat panel is closed
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const newMsg = messages[messages.length - 1];
      const isFromPartner = newMsg && (
        newMsg.sender_id !== user?.id && 
        (!user?.email || newMsg.sender_email.toLowerCase() !== user.email.toLowerCase())
      );

      if (isFromPartner && !isOpen) {
        setHasUnread(true);
        setUnreadCount((prev) => prev + 1);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isOpen, user]);

  // When user opens the floating chat panel, mark unread as read and clear dot
  const handleOpenChat = () => {
    setIsOpen(true);
    setHasUnread(false);
    setUnreadCount(0);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherTyping, isOpen]);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button with Animated Notification Dot */}
      {!isOpen && (
        <motion.button
          className={`floating-chat-trigger ${hasUnread ? 'floating-chat-trigger--unread' : ''}`}
          onClick={handleOpenChat}
          initial={{ scale: 0, opacity: 0 }}
          animate={hasUnread ? {
            scale: [1, 1.1, 1, 1.1, 1],
            boxShadow: [
              '0 0 10px rgba(52, 211, 153, 0.4)',
              '0 0 25px rgba(52, 211, 153, 0.9)',
              '0 0 10px rgba(52, 211, 153, 0.4)'
            ],
            transition: { duration: 1.5, repeat: Infinity }
          } : { scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Open Chat"
        >
          {hasUnread && (
            <span className="floating-chat-unread-dot" aria-label="Unread message notification">
              <span className="floating-chat-unread-dot__ping" />
              <span className="floating-chat-unread-dot__core" />
            </span>
          )}
          💬 Chat {unreadCount > 0 && `(${unreadCount})`}
        </motion.button>
      )}

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="floating-chat-panel"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="floating-chat-header">
              <div className="floating-chat-title">
                💬 {partnerNick} Chat
              </div>
              <button 
                className="floating-chat-close" 
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
              >
                ✕
              </button>
            </div>

            {/* Messages Body */}
            <div className="floating-chat-messages">
              {messages.length === 0 ? (
                <div className="floating-chat-empty">
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

            {/* Input Footer */}
            <div className="floating-chat-input-area">
              <input
                className="floating-chat-input"
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                autoComplete="off"
              />
              <button className="floating-chat-send" onClick={handleSend}>
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;
