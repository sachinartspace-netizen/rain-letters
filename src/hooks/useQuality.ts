import { useState, useEffect, useMemo } from 'react';

type QualityLevel = 'low' | 'medium' | 'high';

export interface QualitySettings {
  rainCount: number;
  grassCount: number;
  flowerCount: number;
  fireflyCount: number;
  pixelRatio: number;
  shadows: boolean;
}

const SETTINGS: Record<QualityLevel, QualitySettings> = {
  low: { rainCount: 1000, grassCount: 300, flowerCount: 15, fireflyCount: 10, pixelRatio: 1.0, shadows: false },
  medium: { rainCount: 3000, grassCount: 800, flowerCount: 30, fireflyCount: 25, pixelRatio: 1.5, shadows: false },
  high: { rainCount: 5000, grassCount: 2000, flowerCount: 50, fireflyCount: 50, pixelRatio: 2.0, shadows: true }
};

export default function useQuality() {
  const [quality, setQualityState] = useState<QualityLevel>('medium');

  useEffect(() => {
    const saved = localStorage.getItem('rain-letters-quality') as QualityLevel | null;
    if (saved && SETTINGS[saved]) {
      setQualityState(saved);
      return;
    }

    const isMobile = typeof window !== 'undefined' && 
                     ('ontouchstart' in window || navigator.maxTouchPoints > 0) && 
                     window.innerWidth < 768;
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    
    let autoQuality: QualityLevel = 'medium';
    if (isMobile) {
      autoQuality = 'low';
    } else if (cores < 4) {
      autoQuality = 'medium';
    } else {
      autoQuality = 'high';
    }

    setQualityState(autoQuality);
  }, []);

  const setQuality = (newQuality: QualityLevel) => {
    setQualityState(newQuality);
    localStorage.setItem('rain-letters-quality', newQuality);
  };

  const qualitySettings = useMemo(() => SETTINGS[quality], [quality]);

  return { quality, setQuality, qualitySettings };
}
