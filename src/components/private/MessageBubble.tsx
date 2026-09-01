import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../lib/database';
import { getDisplayNameFromEmail } from '../../lib/auth';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showSender = true }) => {
  const timeString = new Date(message.created_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const resolvedSenderName = getDisplayNameFromEmail(message.sender_email) || message.sender_name || 'User';

  return (
    <motion.div
      className={`message-bubble ${isOwn ? 'message-bubble--own' : 'message-bubble--other'}`}
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {showSender && !isOwn && (
        <div className="message-bubble__sender">{resolvedSenderName}</div>
      )}
      <div className="message-bubble__text">{message.message}</div>
      <div className="message-bubble__time">{timeString}</div>
    </motion.div>
  );
};

export default MessageBubble;
