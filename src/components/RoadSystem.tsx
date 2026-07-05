'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getRoadPosition, getRoadTangent, ROAD_LENGTH } from '../utils/roadGeometry';
import timelineData from '../../content/timeline.json';

// Individual Road Tile Segment
const RoadTile = ({ zOffset }: { zOffset: number }) => {
  const { roadMesh, laneDashes, trees, checkpoints } = useMemo(() => {
    const segmentCount = 200;
    const roadWidth = 6.8;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const dashesList: { pos: THREE.Vector3; rotY: number }[] = [];

    // 1. Build straight asphalt mesh
    for (let i = 0; i <= segmentCount; i++) {
      const segmentT = i / segmentCount;
      const zLocal = -segmentT * ROAD_LENGTH;
      const zWorld = zLocal - zOffset;

      const x = 0;
      const y = 0;
      
      const pLeft = new THREE.Vector3(x - roadWidth / 2, y, zWorld);
      const pRight = new THREE.Vector3(x + roadWidth / 2, y, zWorld);
      
      vertices.push(pLeft.x, pLeft.y, pLeft.z);
      vertices.push(pRight.x, pRight.y, pRight.z);
      
      uvs.push(0, segmentT * 100);
      uvs.push(1, segmentT * 100);

      // Dash markings spaced closely
      if (i % 2 === 0) {
        dashesList.push({
          pos: new THREE.Vector3(x, y + 0.005, zWorld),
          rotY: 0,
        });
      }
      
      if (i < segmentCount) {
        const vIdx = i * 2;
        indices.push(vIdx, vIdx + 1, vIdx + 2);
        indices.push(vIdx + 1, vIdx + 3, vIdx + 2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    // 2. Flanking trees
    const treesList = [];
    const treeCount = 70;
    for (let i = 0; i < treeCount; i++) {
      const t = i / treeCount;
      const zWorld = -t * ROAD_LENGTH - zOffset;
      const side = i % 2 === 0 ? 1 : -1;
      const roadOffset = 5.2 + Math.random() * 7.5;
      const treeX = roadOffset * side;
      const height = 1.3 + Math.random() * 1.0;
      const radius = 0.4 + Math.random() * 0.3;
      const isSage = Math.random() > 0.4;

      treesList.push({
        id: `tree-${zOffset}-${i}`,
        position: [treeX, height / 2, zWorld] as [number, number, number],
        height,
        radius,
        color: isSage ? '#A3C986' : '#59AA6B',
      });
    }

    // 3. Checkpoint Gates (only render on tiles >= 0 to avoid duplicates behind start)
    const checkpointsList = [];
    if (zOffset >= 0) {
      const activeCheckpoints = timelineData.filter((item) => item.progress > 0);
      for (const cp of activeCheckpoints) {
        const zWorld = -cp.progress * ROAD_LENGTH - zOffset;
        checkpointsList.push({
          id: `cp-${zOffset}-${cp.id}`,
          position: [0, 0, zWorld] as [number, number, number],
        });
      }
    }

    return {
      roadMesh: geom,
      laneDashes: dashesList,
      trees: treesList,
      checkpoints: checkpointsList,
    };
  }, [zOffset]);

  return (
    <group>
      {/* Asphalt road segment */}
      <mesh receiveShadow geometry={roadMesh}>
        <meshStandardMaterial
          color="#313131"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Dotted Lane Markings */}
      {laneDashes.map((dash, idx) => (
        <mesh 
          key={idx} 
          position={[dash.pos.x, dash.pos.y, dash.pos.z]} 
          rotation={[0, dash.rotY, 0]}
        >
          <boxGeometry args={[0.07, 0.005, 1.1]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}

      {/* Checkpoint Rings */}
      {checkpoints.map((cp) => (
        <group key={cp.id} position={cp.position}>
          <mesh position={[0, 2.5, 0]}>
            <torusGeometry args={[3.8, 0.05, 6, 20]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Flanking Trees */}
      {trees.map((t) => (
        <group key={t.id} position={t.position}>
          <mesh position={[0, -t.height/2 + 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.1, 0.4, 5]} />
            <meshStandardMaterial color="#313131" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <coneGeometry args={[t.radius, t.height, 5]} />
            <meshStandardMaterial color={t.color} roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Soft White Clouds
const FloatingClouds = () => {
  const clouds = useMemo(() => {
    const arr = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const z = -(Math.random() * ROAD_LENGTH * 2);
      const x = (Math.random() - 0.5) * 120;
      const y = 11 + Math.random() * 8;
      const scale = 1.8 + Math.random() * 2.8;
      const speed = 0.05 + Math.random() * 0.06;

      arr.push({
        id: `cloud-${i}`,
        scale,
        speed,
        offset: new THREE.Vector3(x, y, z),
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {clouds.map((c) => (
        <group key={c.id} position={[c.offset.x, c.offset.y, c.offset.z]}>
          <mesh castShadow>
            <sphereGeometry args={[c.scale, 5, 5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.85} />
          </mesh>
          <mesh position={[c.scale * 0.45, -c.scale * 0.1, 0]} castShadow>
            <sphereGeometry args={[c.scale * 0.65, 5, 5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.85} />
          </mesh>
          <mesh position={[-c.scale * 0.45, -c.scale * 0.1, 0]} castShadow>
            <sphereGeometry args={[c.scale * 0.65, 5, 5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 3D Lamp Post at the home screen starting position
const LightPost = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.16, 8]} />
        <meshStandardMaterial color="#404040" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Main Vertical Pole */}
      <mesh castShadow position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.045, 0.065, 3.4, 8]} />
        <meshStandardMaterial color="#313131" roughness={0.6} metalness={0.6} />
      </mesh>
      {/* Arm extension (facing left/over the road) */}
      <mesh castShadow position={[-0.32, 3.32, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.68, 6]} />
        <meshStandardMaterial color="#313131" roughness={0.6} metalness={0.6} />
      </mesh>
      {/* Lamp Head */}
      <mesh castShadow position={[-0.64, 3.26, 0]}>
        <boxGeometry args={[0.32, 0.12, 0.22]} />
        <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Emissive bulb glass */}
      <mesh position={[-0.64, 3.19, 0]}>
        <boxGeometry args={[0.26, 0.02, 0.16]} />
        <meshBasicMaterial color="#FFF5D0" />
      </mesh>
      {/* Warm spotLight cone illuminating the road */}
      <spotLight 
        position={[-0.64, 3.18, 0]} 
        angle={Math.PI / 3.8} 
        penumbra={0.7} 
        intensity={6.0} 
        distance={20} 
        castShadow
        color="#FFF5D0" 
      />
    </group>
  );
};

export default function RoadSystem() {
  return (
    <group>
      {/* 
        Giant Flat Grassy Floor base (#59AA6B Medium Green) 
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, -ROAD_LENGTH]} receiveShadow>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial color="#5CA055" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* 
        Tiled Road Segments:
        - Segment -1 (zOffset = -800): stretches behind from Z = 800 to Z = 0 (extends road behind start line)
        - Segment 0 (zOffset = 0): stretches from Z = 0 to Z = -800
        - Segment 1 (zOffset = 800): stretches from Z = -800 to Z = -1600 (identical tile copy)
      */}
      <RoadTile zOffset={-ROAD_LENGTH} />
      <RoadTile zOffset={0} />
      <RoadTile zOffset={ROAD_LENGTH} />

      {/* 3D Lamp Post at the home screen starting point */}
      <LightPost position={[3.8, 0, -3.8]} />

      {/* Clouds */}
      <FloatingClouds />
    </group>
  );
}
