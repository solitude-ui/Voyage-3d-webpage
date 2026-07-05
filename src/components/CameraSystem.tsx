'use client';

import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../hooks/useGameStore';
import { getRoadPosition, getRoadTangent } from '../utils/roadGeometry';

export default function CameraSystem() {
  const scrollProgress = useGameStore((state) => state.scrollProgress);

  useFrame((state) => {
    const carPos = getRoadPosition(scrollProgress);
    const carTangent = getRoadTangent(scrollProgress);
    
    // Parent-child camera tracking: locked exactly behind and above the car.
    // No lerp lag or dynamic offsets to guarantee tight, responsive racing feedback.
    const chaseDistance = -4.2; // Zoomed in closer
    const chaseHeight = 1.35;   // Low eye-level view

    const targetPos = new THREE.Vector3(
      carPos.x + carTangent.x * chaseDistance,
      carPos.y + chaseHeight,
      carPos.z + carTangent.z * chaseDistance
    );
    
    const targetLook = new THREE.Vector3(
      carPos.x + carTangent.x * 4.0,
      carPos.y + 0.4,
      carPos.z + carTangent.z * 4.0
    );

    // Apply positions directly with no rubber-band delay
    state.camera.position.copy(targetPos);
    state.camera.lookAt(targetLook);
  });

  return null;
}
