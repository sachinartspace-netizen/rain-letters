import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface FogSystemProps {
  density?: number;
  color?: string;
}

const FogSystem: React.FC<FogSystemProps> = ({
  density = 0.04,
  color = '#0a1628'
}) => {
  const { scene } = useThree();

  useEffect(() => {
    const fog = new THREE.FogExp2(color, density);
    scene.fog = fog;

    return () => {
      scene.fog = null;
    };
  }, [scene, density, color]);

  return null;
};

export default React.memo(FogSystem);
