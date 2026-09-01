import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface RainSystemProps {
  intensity?: number;
  windStrength?: number;
  speed?: number;
  particleCount?: number;
}

const vertexShader = `
  attribute float velocity;
  attribute float size;
  uniform float time;
  uniform float speed;
  uniform float windStrength;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    
    float fallDelta = time * velocity * speed;
    pos.y -= fallDelta;
    
    pos.x += windStrength * time * velocity * 0.3;
    
    float totalHeight = 20.0;
    pos.y = 15.0 - mod(15.0 - pos.y, totalHeight);
    
    pos.x = -15.0 + mod(15.0 + pos.x, 30.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Clamp point size so close particles don't block text
    float rawSize = size * (120.0 / -mvPosition.z);
    gl_PointSize = clamp(rawSize, 1.5, 12.0);
    vAlpha = 0.25 + (velocity * 0.02);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distX = abs(coord.x);
    float distY = abs(coord.y);
    
    // Thin streak filter
    if (distX > 0.025) discard;
    
    float alpha = (1.0 - (distY * 2.0)) * vAlpha;
    if (alpha <= 0.0) discard;
    
    gl_FragColor = vec4(0.75, 0.88, 1.0, alpha);
  }
`;

const RainSystem: React.FC<RainSystemProps> = ({
  intensity = 0.5,
  windStrength = 0.1,
  speed = 1.0,
  particleCount = 3000
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const activeCount = Math.floor(particleCount * Math.max(0.1, intensity));

  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 20 - 5;
      // Position rain behind or around camera, avoiding extreme foreground overlay
      pos[i * 3 + 2] = (Math.random() - 0.7) * 20;
      
      vel[i] = 10.0 + Math.random() * 10.0;
      sz[i] = 1.5 + Math.random() * 2.0;
    }

    return [pos, vel, sz];
  }, [particleCount]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.windStrength.value = windStrength;
      materialRef.current.uniforms.speed.value = speed;
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.setDrawRange(0, activeCount);
    }
  });

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    windStrength: { value: windStrength },
    speed: { value: speed }
  }), [windStrength, speed]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} args={[positions, 3]} />
        <bufferAttribute attach="attributes-velocity" count={particleCount} array={velocities} itemSize={1} args={[velocities, 1]} />
        <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default React.memo(RainSystem);
