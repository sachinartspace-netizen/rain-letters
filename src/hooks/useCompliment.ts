import { useState, useEffect } from 'react';
import { compliments, birthdayConfig } from '../data/compliments';

export default function useCompliment() {
  const [text, setText] = useState('');
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    if (month === birthdayConfig.month && date === birthdayConfig.day) {
      setIsBirthday(true);
      setText(`${birthdayConfig.greeting}\n${birthdayConfig.name}`);
      return;
    }

    const lastIdxStr = localStorage.getItem('rain-letters-last-compliment');
    let nextIdx = 0;
    
    if (lastIdxStr !== null) {
      const lastIdx = parseInt(lastIdxStr, 10);
      if (!isNaN(lastIdx) && lastIdx >= 0) {
        nextIdx = (lastIdx + 1) % compliments.length;
      }
    }

    localStorage.setItem('rain-letters-last-compliment', nextIdx.toString());
    setText(compliments[nextIdx]);
  }, []);

  return { text, isBirthday };
}
