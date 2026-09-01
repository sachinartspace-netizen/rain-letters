import React, { useState, useEffect } from 'react';
import { loadingMessages } from '../../data/compliments';
import '../../styles/transitions.css';

interface ThemedLoaderProps {
  inline?: boolean;
  message?: string;
}

const ThemedLoader: React.FC<ThemedLoaderProps> = ({ inline = false, message }) => {
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    if (!message) {
      const randomMsg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setDisplayMessage(randomMsg);
    }
  }, [message]);

  return (
    <div className={`themed-loader ${inline ? 'themed-loader--inline' : ''}`}>
      <div className="themed-loader__message">
        {displayMessage}
      </div>
      <div className="themed-loader__dots">
        <div className="themed-loader__dot"></div>
        <div className="themed-loader__dot"></div>
        <div className="themed-loader__dot"></div>
      </div>
    </div>
  );
};

export default ThemedLoader;
