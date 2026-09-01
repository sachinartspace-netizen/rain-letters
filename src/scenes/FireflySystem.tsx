import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface FireflySystemProps {
  count?: number;
  visible?: boolean;
}

const FireflySystem: React.FC<FireflySystemProps> = ({
  count = 30,
  visible = true
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -12 + Math.random() * 24;
      pos[i * 3 + 1] = -3 + Math.random() * 4;
      pos[i * 3 + 2] = -2 + Math.random() * 4;
      phs[i] = Math.random() * Math.PI * 2;
    }
    return [pos, phs];
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [positions, phases]);

  useFrame((state) => {
    if (!visible || !pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const phs = pointsRef.current.geometry.attributes.phase.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Gentle floating
      pos[i * 3] += Math.sin(time * 0.5 + phs[i]) * 0.005;
      pos[i * 3 + 1] += Math.cos(time * 0.3 + phs[i]) * 0.005;
      pos[i * 3 + 2] += Math.sin(time * 0.4 + phs[i]) * 0.005;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.1}
        color="#f0d78c"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default React.memo(FireflySystem);
