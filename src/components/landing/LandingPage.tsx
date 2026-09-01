import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RainCanvas from '../layout/RainCanvas';
import GreetingText from './GreetingText';
import NameEntry from './NameEntry';
import GoogleLoginPrompt from './GoogleLoginPrompt';
import ThemedLoader from '../layout/ThemedLoader';
import useCompliment from '../../hooks/useCompliment';
import '../../styles/landing.css';

type LandingState = 'greeting' | 'name-entry' | 'login-prompt' | 'authenticating';

const LandingPage: React.FC = () => {
  const [currentState, setCurrentState] = useState<LandingState>('greeting');
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const { text, isBirthday } = useCompliment();

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseX(e.clientX);
    setMouseY(e.clientY);
  };

  const handleContainerClick = () => {
    if (currentState === 'greeting') {
      setCurrentState('name-entry');
    }
  };

  const handleValidName = (_name: string) => {
    setCurrentState('login-prompt');
  };

  const handleAuthStart = () => {
    setCurrentState('authenticating');
  };

  return (
    <div className="landing-page" onMouseMove={handleMouseMove} onClick={handleContainerClick}>
      <RainCanvas className="landing-bg" interactive={false} />
      
      <div className="landing-content">
        {/* The central typography / compliment text ALWAYS remains visible */}
        {currentState !== 'authenticating' && (
          <motion.div
            key="greeting-persistent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="greeting-container"
          >
            <GreetingText 
              text={text} 
              isBirthday={isBirthday} 
              mouseX={mouseX} 
              mouseY={mouseY}
              compact={currentState !== 'greeting'}
            />

            {/* "tap to enter" prompt only visible in initial greeting state */}
            {currentState === 'greeting' && (
              <motion.div 
                className="landing-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                tap to enter
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Interactive states (Name Entry, Login Prompt, Authenticating) render right below text */}
        <AnimatePresence mode="wait">
          {currentState === 'name-entry' && (
            <motion.div
              key="name-entry"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <NameEntry onValidName={handleValidName} />
            </motion.div>
          )}

          {currentState === 'login-prompt' && (
            <motion.div
              key="login-prompt"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <GoogleLoginPrompt onAuthStart={handleAuthStart} />
            </motion.div>
          )}

          {currentState === 'authenticating' && (
            <motion.div
              key="authenticating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ThemedLoader inline />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LandingPage;
