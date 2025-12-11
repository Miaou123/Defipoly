import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface HouseGeometries {
  walls: THREE.BufferGeometry;
  roof: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  accents: THREE.BufferGeometry;
  windows?: THREE.BufferGeometry;
}

/**
 * Safely merge geometries and dispose originals
 */
export function mergeAndDispose(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }
  if (geometries.length === 1) {
    return geometries[0]!;
  }
  const merged = mergeGeometries(geometries, false);
  geometries.forEach(g => g.dispose());
  return merged || new THREE.BufferGeometry();
}

/**
 * Helper to create and position a box geometry
 */
export function createBox(
  width: number, 
  height: number, 
  depth: number, 
  x = 0, 
  y = 0, 
  z = 0
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, height, depth);
  if (x !== 0 || y !== 0 || z !== 0) {
    geo.translate(x, y, z);
  }
  return geo;
}

/**
 * Helper to create and position a cylinder geometry
 */
export function createCylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
  x = 0,
  y = 0,
  z = 0
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  if (x !== 0 || y !== 0 || z !== 0) {
    geo.translate(x, y, z);
  }
  return geo;
}

/**
 * Helper to create and position a cone geometry
 */
export function createCone(
  radius: number,
  height: number,
  segments: number,
  x = 0,
  y = 0,
  z = 0
): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(radius, height, segments);
  if (x !== 0 || y !== 0 || z !== 0) {
    geo.translate(x, y, z);
  }
  return geo;
}

/**
 * Helper to create and position a sphere geometry
 */
export function createSphere(
  radius: number,
  widthSegments: number,
  heightSegments: number,
  x = 0,
  y = 0,
  z = 0
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  if (x !== 0 || y !== 0 || z !== 0) {
    geo.translate(x, y, z);
  }
  return geo;
}

/**
 * Helper to create a torus (ring) geometry
 */
export function createTorus(
  radius: number,
  tube: number,
  radialSegments: number,
  tubularSegments: number,
  x = 0,
  y = 0,
  z = 0,
  rotationX = 0
): THREE.BufferGeometry {
  const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  if (rotationX !== 0) {
    geo.rotateX(rotationX);
  }
  if (x !== 0 || y !== 0 || z !== 0) {
    geo.translate(x, y, z);
  }
  return geo;
}