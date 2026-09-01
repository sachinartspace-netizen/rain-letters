import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  name: string;
  isTyping: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ name, isTyping }) => {
  if (!isTyping) return null;

  const dotVariants = {
    initial: { y: 0 },
    animate: { y: [-3, 3, -3], transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" as const } }
  };

  return (
    <motion.div
      className="typing-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="typing-dots">
        <motion.div className="typing-dot" variants={dotVariants} initial="initial" animate="animate" />
        <motion.div className="typing-dot" variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.2 }} />
        <motion.div className="typing-dot" variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.4 }} />
      </div>
      <div className="typing-text">{name} is typing...</div>
    </motion.div>
  );
};

export default TypingIndicator;
