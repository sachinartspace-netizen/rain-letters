import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { validNames } from '../../data/compliments';

interface NameEntryProps {
  onValidName: (name: string) => void;
}

const NameEntry: React.FC<NameEntryProps> = ({ onValidName }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase();
    
    if (validNames.map(n => n.toLowerCase()).includes(cleanName)) {
      onValidName(cleanName);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); // Reset animation state
    }
  };

  return (
    <div className="name-entry">
      <h2 className="name-entry__title">WHO ARE YOU?</h2>
      <form onSubmit={handleSubmit}>
        <motion.div
          animate={error ? { x: [0, -10, 10, -10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <input
            ref={inputRef}
            type="text"
            className="name-entry__input"
            placeholder="enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
          />
        </motion.div>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="name-entry__error"
          >
            hmm... I don't know you
          </motion.div>
        )}
        <button type="submit" style={{ display: 'none' }}>Submit</button>
      </form>
    </div>
  );
};

export default NameEntry;
