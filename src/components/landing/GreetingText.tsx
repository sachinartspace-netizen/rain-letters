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

// Split text into grapheme clusters so compound emojis (like 🙂↕️, 🫃, 🤓) remain intact
const getGraphemes = (str: string): string[] => {
  try {
    if (typeof Intl !== 'undefined' && 'Segmenter' in (Intl as any)) {
      const SegmenterClass = (Intl as any).Segmenter;
      const segmenter = new SegmenterClass('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(str), (m: any) => m.segment);
    }
  } catch {
    // Fallback if Intl.Segmenter is unsupported
  }
  return Array.from(str);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const charVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
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
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="greeting-content"
      >
        {lines.map((line, lineIndex) => {
          const words = line.split(' ');
          return (
            <div key={lineIndex} className="greeting-line">
              {words.map((word, wordIndex) => {
                const graphemes = getGraphemes(word);
                return (
                  <span key={wordIndex} className="greeting-word">
                    {graphemes.map((char, charIndex) => (
                      <motion.span
                        key={`${lineIndex}-${wordIndex}-${charIndex}`}
                        variants={charVariants}
                        className="greeting-letter"
                      >
                        {char}
                      </motion.span>
                    ))}
                    {wordIndex < words.length - 1 && (
                      <span className="greeting-letter">&nbsp;</span>
                    )}
                  </span>
                );
              })}
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
