import React, { createContext, useContext, ReactNode } from 'react';
import useGarden from '../hooks/useGarden';

type GardenContextType = ReturnType<typeof useGarden>;

const GardenContext = createContext<GardenContextType | undefined>(undefined);

export function GardenProvider({ children, bothOnline }: { children: ReactNode; bothOnline: boolean }) {
  const gardenState = useGarden(bothOnline);
  
  return (
    <GardenContext.Provider value={gardenState}>
      {children}
    </GardenContext.Provider>
  );
}

export function useGardenContext() {
  const context = useContext(GardenContext);
  if (context === undefined) {
    throw new Error('useGardenContext must be used within a GardenProvider');
  }
  return context;
}
