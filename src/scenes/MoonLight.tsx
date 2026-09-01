import React from 'react';

export interface MoonLightProps {
  intensity?: number;
}

const MoonLight: React.FC<MoonLightProps> = ({ intensity = 1 }) => {
  return (
    <group>
      <ambientLight color="#1a2a4a" intensity={0.15 * intensity} />
      <directionalLight 
        position={[-5, 8, 3]} 
        color="#8899bb" 
        intensity={0.3 * intensity} 
      />
    </group>
  );
};

export default React.memo(MoonLight);
