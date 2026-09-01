import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import RainWorld, { RainWorldProps } from '../../scenes/RainWorld';

export interface RainCanvasProps extends RainWorldProps {
  style?: React.CSSProperties;
  className?: string;
  interactive?: boolean;
}

const RainCanvas: React.FC<RainCanvasProps> = ({
  style,
  className,
  interactive = false,
  ...worldProps
}) => {
  return (
    <div 
      className={className} 
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: interactive ? 'auto' : 'none',
        ...style
      }}
    >
      <Canvas
        camera={{ position: [0, 1, 8], fov: 50, near: 0.1, far: 100 }}
        dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={null}>
          <RainWorld {...worldProps} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default React.memo(RainCanvas);
