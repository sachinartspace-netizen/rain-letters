import { useState, useEffect, useCallback } from 'react';

export default function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rain-letters-sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('rain-letters-sound', next.toString());
      return next;
    });
  }, []);

  return { soundEnabled, toggleSound };
}
