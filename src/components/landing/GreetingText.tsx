import React from 'react';
import { motion } from 'framer-motion';
import useReducedMotion from '../../hooks/useReducedMotion';

interface GreetingTextProps {
  text: string;
  isBirthday: boolean;
  mouseX?: number;
  mouseY?: number;
  compact?: boolean;
}

// Robust regex extraction of trailing emojis
const extractTextAndEmoji = (fullText: string) => {
  if (!fullText) return { textPart: '', emojiPart: '' };
  
  // Match any unicode emoji pictograph sequence at the end of the text
  const emojiRegex = /[\p{Extended_Pictographic}\uFE0F\u200D\u2190-\u21FF\u2700-\u27BF]+/gu;
  const matches = Array.from(fullText.matchAll(emojiRegex));
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const matchIndex = lastMatch.index ?? fullText.length;
    
    // If the emoji is located near the end of the line
    if (matchIndex >= Math.max(0, fullText.length - 12)) {
      return {
        textPart: fullText.slice(0, matchIndex).trim(),
        emojiPart: fullText.slice(matchIndex).trim(),
      };
    }
  }
  
  return { textPart: fullText.trim(), emojiPart: '' };
};

const GreetingText: React.FC<GreetingTextProps> = ({ 
  text, 
  isBirthday, 
  mouseX = 0, 
  mouseY = 0,
  compact = false 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const lines = text.split('\n');
  
  // Subtle parallax effect
  const parallaxX = (mouseX - window.innerWidth / 2) * 0.008;
  const parallaxY = (mouseY - window.innerHeight / 2) * 0.008;
  
  const containerStyle = prefersReducedMotion ? {} : {
    transform: `translate(${parallaxX}px, ${parallaxY}px)`,
    transition: 'transform 0.1s ease-out'
  };

  return (
    <div 
      className={`greeting-text ${isBirthday ? 'greeting-text--birthday' : ''} ${compact ? 'greeting-text--compact' : ''}`}
      style={containerStyle}
    >
      {isBirthday && (
        <motion.div 
          className="greeting-birthday-emoji"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
        >
          🌧
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className="greeting-content"
      >
        {lines.map((line, lineIndex) => {
          const { textPart, emojiPart } = extractTextAndEmoji(line);
          return (
            <div key={lineIndex} className="greeting-line">
              <span className="greeting-text-part">{textPart}</span>
              {emojiPart && (
                <span className="greeting-emoji-part" aria-label="emoji">
                  &nbsp;{emojiPart}
                </span>
              )}
            </div>
          );
        })}
      </motion.div>

      {isBirthday && (
        <div className="greeting-flowers">
          🌱 🌼 🌱 🌼 🌱
        </div>
      )}
    </div>
  );
};

export default React.memo(GreetingText);
