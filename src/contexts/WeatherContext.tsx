import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WeatherContextType {
  rainIntensity: number;
  windStrength: number;
  setRainIntensity: (val: number) => void;
  setWindStrength: (val: number) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [rainIntensity, setRainIntensity] = useState(0.5);
  const [windStrength, setWindStrength] = useState(0.1);

  return (
    <WeatherContext.Provider value={{ rainIntensity, windStrength, setRainIntensity, setWindStrength }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
