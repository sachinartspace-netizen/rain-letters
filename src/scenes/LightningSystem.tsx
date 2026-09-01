import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface LightningSystemProps {
  enabled?: boolean;
}

const LightningSystem: React.FC<LightningSystemProps> = ({
  enabled = true
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const nextFlashTime = useRef<number>(0);
  const isFlashing = useRef<boolean>(false);
  const flashStartTime = useRef<number>(0);

  useFrame((state) => {
    if (!enabled || !lightRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Initialize next flash time
    if (nextFlashTime.current === 0) {
      nextFlashTime.current = time + 30 + Math.random() * 60; // 30-90s
    }

    // Trigger flash
    if (!isFlashing.current && time > nextFlashTime.current) {
      isFlashing.current = true;
      flashStartTime.current = time;
      nextFlashTime.current = time + 30 + Math.random() * 60;
    }

    // Process flash sequence
    if (isFlashing.current) {
      const flashElapsed = (time - flashStartTime.current) * 1000; // ms
      
      if (flashElapsed < 100) {
        lightRef.current.intensity = 2;
      } else if (flashElapsed < 150) {
        lightRef.current.intensity = 0;
      } else if (flashElapsed < 250) {
        lightRef.current.intensity = 0.8;
      } else {
        lightRef.current.intensity = 0;
        isFlashing.current = false;
      }
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 15, -5]}
      color="#c8d8f0"
      intensity={0}
      distance={50}
      decay={2}
    />
  );
};

export default React.memo(LightningSystem);
