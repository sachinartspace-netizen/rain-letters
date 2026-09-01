import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GrassSystemProps {
  bladeCount?: number;
  windStrength?: number;
}

const vertexShader = `
  uniform float time;
  uniform float windStrength;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    if (pos.y > 0.0) {
      vColor = vec3(0.176, 0.420, 0.247); // Lighter green (#2d6b3f)
      
      float wind = sin(time * 2.0 + instanceMatrix[3][0] * 0.5) * windStrength;
      pos.x += wind;
      pos.z += wind * 0.5;
    } else {
      vColor = vec3(0.102, 0.251, 0.157); // Dark green (#1a4028)
    }
    
    vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

const GrassSystem: React.FC<GrassSystemProps> = ({
  bladeCount = 800,
  windStrength = 0.1
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.05, 0, 0, // base left
       0.05, 0, 0, // base right
       0.0, 1.0, 0 // tip
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, []);

  const matrices = useMemo(() => {
    const m = new Float32Array(bladeCount * 16);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < bladeCount; i++) {
      dummy.position.set(
        -12 + Math.random() * 24, // x: -12 to 12
        -3.5 + Math.random() * 1, // y: -3.5 to -2.5
        -2 + Math.random() * 4    // z: -2 to 2
      );
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.5 + Math.random() * 0.5);
      dummy.updateMatrix();
      dummy.matrix.toArray(m, i * 16);
    }
    return m;
  }, [bladeCount]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.windStrength.value = windStrength;
    }
  });

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    windStrength: { value: windStrength }
  }), [windStrength]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, bladeCount]}>
      <instancedBufferAttribute attach="instanceMatrix" count={bladeCount} array={matrices} itemSize={16} args={[matrices, 16]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

export default React.memo(GrassSystem);
