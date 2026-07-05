'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../hooks/useGameStore';
import CarLoader from './CarLoader';
import RoadSystem from './RoadSystem';
import CameraSystem from './CameraSystem';
import { getRoadPosition } from '../utils/roadGeometry';

// Performance / FPS tracker component inside the Canvas context
const PerformanceMonitor = () => {
  const setFps = useGameStore((state) => state.setFps);
  const lastTime = React.useRef(performance.now());
  const frames = React.useRef(0);

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now >= lastTime.current + 1000) {
      const calculatedFps = Math.round((frames.current * 1000) / (now - lastTime.current));
      setFps(calculatedFps);
      frames.current = 0;
      lastTime.current = now;
    }
  });

  return null;
};

// Fog controller based on scroll timeline checkpoints (Atmospheric Ethereal / Dreamcore transitions)
const EnvironmentEffects = () => {
  const scrollProgress = useGameStore((state) => state.scrollProgress);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  // Very low fog density — just enough to soften the far horizon
  let fogColor = '#CADAE8';
  const fogDensity = 0.004;

  return (
    <>
      <color attach="background" args={[fogColor]} />
      {graphicsQuality !== 'low' && <fogExp2 attach="fog" args={[fogColor, fogDensity]} />}
    </>
  );
};

// Dynamic light that moves with the car to maintain crisp shadows
const MovingLight = ({ graphicsQuality }: { graphicsQuality: string }) => {
  const scrollProgress = useGameStore((state) => state.scrollProgress);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  useFrame(() => {
    if (!lightRef.current || !targetRef.current) return;
    const pos = getRoadPosition(scrollProgress);
    
    // Position the light offset relative to the car position
    lightRef.current.position.set(pos.x + 35, 75, pos.z + 25);
    
    // Keep the target locked directly on the car position
    targetRef.current.position.set(pos.x, 0, pos.z);
  });

  return (
    <group>
      <object3D ref={targetRef} />
      <directionalLight
        ref={lightRef}
        castShadow={graphicsQuality === 'high'}
        intensity={2.2}
        shadow-mapSize-width={graphicsQuality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={graphicsQuality === 'high' ? 2048 : 1024}
        shadow-camera-far={180}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.00015} // Tight bias to prevent shadow detaching or clipping
      />
    </group>
  );
};

export default function ThreeCanvas() {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  // Set shadow map settings based on graphics quality
  const shadowMapEnabled = graphicsQuality !== 'low';

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas
        shadows={shadowMapEnabled ? 'percentage' : false}
        gl={{
          antialias: graphicsQuality === 'high',
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={graphicsQuality === 'high' ? [1, 2] : 1}
      >
        <Suspense fallback={null}>
          <EnvironmentEffects />
          
          {/* Lighting Rig — bright outdoor daytime */}
          <ambientLight intensity={1.2} />
          <hemisphereLight args={['#CADAE8', '#59AA6B', 1.0]} />
          {/* Dynamic Light Rig that tracks the car along the Z axis for high resolution shadows */}
          <MovingLight graphicsQuality={graphicsQuality} />
          
          {/* Main components */}
          <RoadSystem />
          <CarLoader />
          <CameraSystem />
          
          <PerformanceMonitor />
        </Suspense>
      </Canvas>
    </div>
  );
}
