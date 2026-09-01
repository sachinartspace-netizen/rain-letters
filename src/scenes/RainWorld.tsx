import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import RainSystem from './RainSystem';
import GrassSystem from './GrassSystem';
import FlowerSystem from './FlowerSystem';
import FogSystem from './FogSystem';
import LightningSystem from './LightningSystem';
import FireflySystem from './FireflySystem';
import MoonLight from './MoonLight';
import * as THREE from 'three';

export interface RainWorldProps {
  rainIntensity?: number;
  windStrength?: number;
  gardenGrowth?: number;
  quality?: 'low' | 'medium' | 'high';
  showFireflies?: boolean;
}

const RainWorld: React.FC<RainWorldProps> = ({
  rainIntensity = 0.5,
  windStrength = 0.1,
  gardenGrowth = 0,
  quality = 'medium',
  showFireflies = true
}) => {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#060e1a');
  }, [scene]);

  const settings = {
    low: { rain: 1000, grass: 300, flowers: 15, fireflies: 10 },
    medium: { rain: 3000, grass: 800, flowers: 30, fireflies: 25 },
    high: { rain: 5000, grass: 2000, flowers: 50, fireflies: 50 }
  }[quality];

  return (
    <>
      <RainSystem intensity={rainIntensity} windStrength={windStrength} particleCount={settings.rain} />
      <GrassSystem bladeCount={settings.grass} windStrength={windStrength} />
      <FlowerSystem growth={gardenGrowth} flowerCount={settings.flowers} />
      <FogSystem />
      <LightningSystem />
      <FireflySystem count={settings.fireflies} visible={showFireflies} />
      <MoonLight />
    </>
  );
};

export default React.memo(RainWorld);
