import React from 'react';
import { motion } from 'framer-motion';

interface GardenViewProps {
  growth: number;
  totalMinutes: number;
  isGrowing: boolean;
}

const GardenView: React.FC<GardenViewProps> = ({ growth, totalMinutes, isGrowing }) => {
  const getStageDescription = (growthValue: number) => {
    if (growthValue <= 10) return 'tiny sprouts';
    if (growthValue <= 30) return 'stems growing';
    if (growthValue <= 60) return 'buds forming';
    if (growthValue <= 80) return 'flowers blooming';
    return 'a beautiful garden';
  };

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <motion.div
      className="garden-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>
        Our Garden
      </h2>
      
      <div style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        {Math.round(growth)}% - {getStageDescription(growth)}
      </div>

      <div className="garden-progress">
        <div 
          className="garden-progress__fill" 
          style={{ width: `${Math.min(100, Math.max(0, growth))}%` }} 
        />
      </div>

      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Your garden has been growing for {hours} hours {minutes} minutes
      </p>

      <div style={{ fontStyle: 'italic', color: isGrowing ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
        {isGrowing ? '🌱 Growing together...' : '🌧 Waiting for rain...'}
      </div>
    </motion.div>
  );
};

export default GardenView;
