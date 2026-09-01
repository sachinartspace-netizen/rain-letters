import { useState, useEffect } from 'react';
import { getGarden, updateGardenGrowth } from '../lib/database';
import { subscribeToGarden } from '../lib/realtime';

const LOCAL_GARDEN_KEY = 'rain-letters-local-garden';

export default function useGarden(bothOnline: boolean) {
  const [growth, setGrowth] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isGrowing, setIsGrowing] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Load local garden state first
    try {
      const saved = localStorage.getItem(LOCAL_GARDEN_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setGrowth(parsed.growth || 0);
        setTotalMinutes(parsed.totalMinutes || 0);
      }
    } catch {}

    const loadGarden = async () => {
      try {
        const garden = await getGarden();
        if (mounted && garden) {
          setGrowth(garden.growth);
          setTotalMinutes(garden.total_minutes);
          localStorage.setItem(LOCAL_GARDEN_KEY, JSON.stringify({ growth: garden.growth, totalMinutes: garden.total_minutes }));
        }
      } catch (error) {
        console.warn('Failed to load DB garden, using local:', error);
      }
    };

    loadGarden();

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToGarden((newGarden) => {
        if (mounted && newGarden) {
          setGrowth(newGarden.growth);
          setTotalMinutes(newGarden.total_minutes);
        }
      });
    } catch {}

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!bothOnline) {
      setIsGrowing(false);
      return;
    }

    setIsGrowing(true);

    const intervalId = setInterval(async () => {
      setGrowth((prevGrowth) => {
        const nextGrowth = Math.min(100, prevGrowth + 0.33);
        setTotalMinutes((prevMins) => {
          const nextMins = prevMins + 1;
          try {
            localStorage.setItem(LOCAL_GARDEN_KEY, JSON.stringify({ growth: nextGrowth, totalMinutes: nextMins }));
          } catch {}
          updateGardenGrowth(nextGrowth, nextMins).catch(() => {});
          return nextMins;
        });
        return nextGrowth;
      });
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [bothOnline]);

  return { growth, totalMinutes, isGrowing };
}
