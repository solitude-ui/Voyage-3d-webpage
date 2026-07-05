import * as THREE from 'three';

// Length of one tiling road segment in world units
export const ROAD_LENGTH = 800;

// Perfectly straight road along the Z axis (x = 0, y = 0)
// Supports infinite progression (t increases indefinitely)
export const getRoadPosition = (t: number): THREE.Vector3 => {
  const z = -t * ROAD_LENGTH;
  return new THREE.Vector3(0, 0, z);
};

// Constant forward tangent pointing down the Z axis
export const getRoadTangent = (t: number): THREE.Vector3 => {
  return new THREE.Vector3(0, 0, -1);
};
