import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface FlowerSystemProps {
  growth?: number;
  flowerCount?: number;
}

const FLOWER_COLORS = ['#e8a0bf', '#f0d78c', '#e8e0d8', '#b8a9c9', '#f0c8a0'];

const FlowerSystem: React.FC<FlowerSystemProps> = ({
  growth = 0,
  flowerCount = 30
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const flowers = useMemo(() => {
    const arr = [];
    for (let i = 0; i < flowerCount; i++) {
      arr.push({
        position: new THREE.Vector3(
          -10 + Math.random() * 20,
          -3 + Math.random() * 0.5,
          -1.5 + Math.random() * 3
        ),
        color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.5
      });
    }
    return arr;
  }, [flowerCount]);

  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 1, 8), []);
  const petalGeo = useMemo(() => new THREE.CircleGeometry(0.15, 16), []);
  const centerGeo = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d6b3f' }), []);
  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0d78c' }), []);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.children.forEach((child, i) => {
        const flower = flowers[i];
        // Gentle swaying
        child.rotation.z = Math.sin(time + flower.phase) * 0.1;
        child.rotation.x = Math.cos(time + flower.phase) * 0.05;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {flowers.map((f, i) => {
        // Calculate growth scales
        const sproutScale = Math.min(1, Math.max(0, growth / 10));
        const stemScale = Math.min(1, Math.max(0, (growth - 10) / 20));
        const bloomScale = Math.min(1, Math.max(0, (growth - 60) / 40));

        return (
          <group key={i} position={f.position} rotation-y={f.rotation} scale={f.scale}>
            {/* Sprout (visible only at very early stage if stem hasn't grown much) */}
            {growth < 20 && sproutScale > 0 && (
               <mesh geometry={centerGeo} material={stemMat} scale={sproutScale} position={[0, 0.1, 0]} />
            )}
            
            {/* Stem */}
            {stemScale > 0 && (
              <mesh geometry={stemGeo} material={stemMat} position={[0, 0.5 * stemScale, 0]} scale-y={stemScale} />
            )}

            {/* Bloom (Petals + Center) */}
            {bloomScale > 0 && (
              <group position={[0, stemScale, 0]} scale={bloomScale}>
                <mesh geometry={centerGeo} material={centerMat} />
                {[0, 1, 2, 3, 4].map((p) => (
                  <mesh
                    key={p}
                    geometry={petalGeo}
                    position={[
                      Math.cos((p / 5) * Math.PI * 2) * 0.15,
                      Math.sin((p / 5) * Math.PI * 2) * 0.15,
                      -0.02
                    ]}
                    rotation-z={(p / 5) * Math.PI * 2}
                  >
                    <meshStandardMaterial color={f.color} side={THREE.DoubleSide} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default React.memo(FlowerSystem);
