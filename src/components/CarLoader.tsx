'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../hooks/useGameStore';
import { getRoadPosition, getRoadTangent } from '../utils/roadGeometry';

type CarModelType = 'glb' | 'fbx' | 'none';



// GLB / GLTF Model Component
const CustomGlbModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive 
      object={scene} 
      scale={0.58}                 // Adjusted to match SUV volume and track width
      rotation={[0, 0, 0]}         // Rotated to face forward (away from camera)
      position={[0, -0.03, 0]}     // Ground alignment Y offset
    />
  );
};

// FBX Model Component
const CustomFbxModel = ({ url }: { url: string }) => {
  const fbx = useFBX(url);
  const isChallenger = url.includes('Free Race Car.fbx');
  
  useEffect(() => {
    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (isChallenger) {
          const name = child.name.toLowerCase();
          
          // Create a custom glossy material
          const newMat = new THREE.MeshStandardMaterial({
            color: '#bc181e', // Premium Crimson Red body paint by default
            roughness: 0.15,
            metalness: 0.9
          });
          
          // Map parts procedurally based on child mesh naming conventions
          if (name.includes('wheel') || name.includes('tire') || name.includes('rubber') || name.includes('rim') || name.includes('hub')) {
            newMat.color.setHex(0x181818);
            newMat.roughness = 0.85;
            newMat.metalness = 0.1;
          } else if (name.includes('glass') || name.includes('window') || name.includes('windshield') || name.includes('mirror_glass')) {
            newMat.color.setHex(0x080808);
            newMat.transparent = true;
            newMat.opacity = 0.65;
            newMat.roughness = 0.05;
            newMat.metalness = 0.95;
          } else if (name.includes('light') || name.includes('headlight') || name.includes('taillight') || name.includes('lens')) {
            const isRed = name.includes('red') || name.includes('tail');
            newMat.color.setHex(isRed ? 0xff2222 : 0xfffee0);
            newMat.emissive.setHex(isRed ? 0xcc0000 : 0xaa9955);
            newMat.emissiveIntensity = 0.8;
            newMat.roughness = 0.1;
          } else if (name.includes('chrome') || name.includes('metal') || name.includes('silver') || name.includes('grille') || name.includes('exhaust')) {
            newMat.color.setHex(0xcccccc);
            newMat.roughness = 0.1;
            newMat.metalness = 0.95;
          } else if (name.includes('interior') || name.includes('seat') || name.includes('steering') || name.includes('dash')) {
            newMat.color.setHex(0x222222);
            newMat.roughness = 0.75;
            newMat.metalness = 0.1;
          } else if (name.includes('carbon') || name.includes('black') || name.includes('trim') || name.includes('spoiler')) {
            newMat.color.setHex(0x1e1e1e);
            newMat.roughness = 0.45;
            newMat.metalness = 0.5;
          }

          child.material = newMat;
        }
      }
    });
  }, [fbx, isChallenger]);

  return (
    <primitive 
      object={fbx} 
      scale={0.008}                // FBX models are often exported 100x larger (cm vs m), so default scale is smaller
      rotation={[0, 0, 0]}         // Rotated to face forward
      position={[0, -0.04, 0]}     // Return to working baseline position
    />
  );
};

// Vibrant Yellow Block Car (3D Rectangle Box fallback)
const BlockCar = ({ scrollSpeed, isBraking }: { scrollSpeed: number; isBraking: boolean }) => {
  const wheelFLRef = useRef<THREE.Mesh>(null);
  const wheelFRRef = useRef<THREE.Mesh>(null);
  const wheelRLRef = useRef<THREE.Mesh>(null);
  const wheelRRRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const speedFactor = scrollSpeed * 0.04;
    if (wheelFLRef.current) wheelFLRef.current.rotation.x += speedFactor;
    if (wheelFRRef.current) wheelFRRef.current.rotation.x += speedFactor;
    if (wheelRLRef.current) wheelRLRef.current.rotation.x += speedFactor;
    if (wheelRRRef.current) wheelRRRef.current.rotation.x += speedFactor;
  });

  return (
    <group>
      {/* Chassis */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.45, 3.8]} />
        <meshStandardMaterial color="#FCD004" roughness={0.25} metalness={0.3} />
      </mesh>

      {/* Cabin */}
      <mesh castShadow position={[0, 0.7, -0.3]}>
        <boxGeometry args={[1.15, 0.38, 1.75]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Windscreens */}
      <mesh position={[0, 0.71, 0.59]}>
        <boxGeometry args={[1.08, 0.35, 0.03]} />
        <meshStandardMaterial color="#4a7fa8" transparent opacity={0.55} roughness={0} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.71, -1.19]}>
        <boxGeometry args={[1.08, 0.35, 0.03]} />
        <meshStandardMaterial color="#4a7fa8" transparent opacity={0.55} roughness={0} metalness={0.1} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.48, 0.35, 1.92]}>
        <boxGeometry args={[0.22, 0.1, 0.02]} />
        <meshBasicMaterial color="#fffef0" />
      </mesh>
      <mesh position={[0.48, 0.35, 1.92]}>
        <boxGeometry args={[0.22, 0.1, 0.02]} />
        <meshBasicMaterial color="#fffef0" />
      </mesh>
      <pointLight position={[0, 0.4, 2.2]} intensity={isBraking ? 0 : 6} distance={18} color="#fffef0" />

      {/* Tail Lights */}
      <mesh position={[-0.48, 0.35, -1.92]}>
        <boxGeometry args={[0.26, 0.1, 0.02]} />
        <meshBasicMaterial color={isBraking ? '#FF1D27' : '#550000'} />
      </mesh>
      <mesh position={[0.48, 0.35, -1.92]}>
        <boxGeometry args={[0.26, 0.1, 0.02]} />
        <meshBasicMaterial color={isBraking ? '#FF1D27' : '#550000'} />
      </mesh>

      {/* Wheels */}
      <mesh ref={wheelFLRef} position={[-0.88, 0.28, 1.1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 14]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh ref={wheelFRRef} position={[0.88, 0.28, 1.1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 14]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh ref={wheelRLRef} position={[-0.88, 0.28, -1.1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 14]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh ref={wheelRRRef} position={[0.88, 0.28, -1.1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 14]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>

      {/* Wheel Arches */}
      <mesh position={[-0.8, 0.32, 1.1]}>
        <boxGeometry args={[0.08, 0.2, 0.64]} />
        <meshStandardMaterial color="#FCD004" />
      </mesh>
      <mesh position={[0.8, 0.32, 1.1]}>
        <boxGeometry args={[0.08, 0.2, 0.64]} />
        <meshStandardMaterial color="#FCD004" />
      </mesh>
      <mesh position={[-0.8, 0.32, -1.1]}>
        <boxGeometry args={[0.08, 0.2, 0.64]} />
        <meshStandardMaterial color="#FCD004" />
      </mesh>
      <mesh position={[0.8, 0.32, -1.1]}>
        <boxGeometry args={[0.08, 0.2, 0.64]} />
        <meshStandardMaterial color="#FCD004" />
      </mesh>
    </group>
  );
};

export default function CarLoader() {
  const carRef = useRef<THREE.Group>(null);
  const scrollProgress = useGameStore((state) => state.scrollProgress);
  const targetProgress = useGameStore((state) => state.targetProgress);
  const scrollSpeed = useGameStore((state) => state.scrollSpeed);
  const selectedCar = useGameStore((state) => state.selectedCar);

  const isBraking = targetProgress < scrollProgress && scrollSpeed > 2;

  useFrame(() => {
    if (!carRef.current) return;

    const pos = getRoadPosition(scrollProgress);
    const tangent = getRoadTangent(scrollProgress);

    // Place car on road surface
    carRef.current.position.set(pos.x, 0, pos.z);

    // Orient car along road direction
    const lookTarget = new THREE.Vector3(pos.x + tangent.x * 5, 0, pos.z + tangent.z * 5);
    carRef.current.lookAt(lookTarget);
  });

  return (
    <group ref={carRef}>
      {selectedCar === 'challenger' && (
        <Suspense fallback={<BlockCar scrollSpeed={scrollSpeed} isBraking={isBraking} />}>
          <CustomGlbModel url="/models/car/dodge_challenger.glb" />
        </Suspense>
      )}
      {selectedCar === 'suv' && (
        <Suspense fallback={<BlockCar scrollSpeed={scrollSpeed} isBraking={isBraking} />}>
          <CustomFbxModel url="/models/car/playerCar.fbx" />
        </Suspense>
      )}
      {selectedCar === 'block' && (
        <BlockCar scrollSpeed={scrollSpeed} isBraking={isBraking} />
      )}
    </group>
  );
}

