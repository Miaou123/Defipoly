import * as THREE from 'three';
import { 
  HouseGeometries, 
  mergeAndDispose, 
  createBox, 
  createCylinder, 
  createCone, 
  createSphere,
  createTorus 
} from './geometryUtils';

// ============================================================
// HOUSE 1 - Simple cottage
// ============================================================
export function createHouse1Geometries(): HouseGeometries {
  const houseWidth = 1.2;
  const houseHeight = 0.9;
  const houseDepth = 1.0;
  const roofHeight = 0.5;
  const hw = houseWidth / 2;
  const hd = houseDepth / 2;
  const peakY = houseHeight + roofHeight;

  // WALLS
  const walls: THREE.BufferGeometry[] = [];
  // Main body
  walls.push(createBox(houseWidth, houseHeight, houseDepth, 0, houseHeight / 2, 0));
  // Front gable (triangle as thin box approximation)
  walls.push(createBox(houseWidth, 0.02, roofHeight * 0.7, 0, houseHeight + roofHeight * 0.35, hd));
  // Back gable
  walls.push(createBox(houseWidth, 0.02, roofHeight * 0.7, 0, houseHeight + roofHeight * 0.35, -hd));

  // ROOF
  const roofs: THREE.BufferGeometry[] = [];
  // Left slope
  const leftRoof = createBox(houseWidth + 0.1, 0.08, houseDepth * 0.75, 0, 0, 0);
  leftRoof.rotateZ(Math.atan2(roofHeight, hw));
  leftRoof.translate(-hw / 2 + 0.1, houseHeight + roofHeight / 2, 0);
  roofs.push(leftRoof);
  // Right slope
  const rightRoof = createBox(houseWidth + 0.1, 0.08, houseDepth * 0.75, 0, 0, 0);
  rightRoof.rotateZ(-Math.atan2(roofHeight, hw));
  rightRoof.translate(hw / 2 - 0.1, houseHeight + roofHeight / 2, 0);
  roofs.push(rightRoof);

  // TRIM (chimney, door frame)
  const trims: THREE.BufferGeometry[] = [];
  // Chimney
  trims.push(createBox(0.25, 0.6, 0.25, -0.5, peakY - 0.1, 0));
  trims.push(createBox(0.32, 0.08, 0.32, -0.5, peakY + 0.24, 0));
  // Door
  trims.push(createBox(0.3, 0.5, 0.05, 0, 0.25, hd + 0.03));

  // ACCENTS (windows)
  const accents: THREE.BufferGeometry[] = [];
  // Front windows
  accents.push(createBox(0.2, 0.25, 0.02, -0.3, 0.55, hd + 0.02));
  accents.push(createBox(0.2, 0.25, 0.02, 0.3, 0.55, hd + 0.02));

  return {
    walls: mergeAndDispose(walls),
    roof: mergeAndDispose(roofs),
    trim: mergeAndDispose(trims),
    accents: mergeAndDispose(accents),
  };
}

// ============================================================
// HOUSE 2 - Two-story with porch
// ============================================================
export function createHouse2Geometries(): HouseGeometries {
  const houseWidth = 1.6;
  const houseHeight = 1.4;
  const houseDepth = 1.2;
  const roofHeight = 0.6;
  const hw = houseWidth / 2;
  const hd = houseDepth / 2;

  // WALLS
  const walls: THREE.BufferGeometry[] = [];
  walls.push(createBox(houseWidth, houseHeight, houseDepth, 0, houseHeight / 2, 0));
  // Gables
  walls.push(createBox(houseWidth, 0.02, roofHeight * 0.8, 0, houseHeight + roofHeight * 0.4, hd));
  walls.push(createBox(houseWidth, 0.02, roofHeight * 0.8, 0, houseHeight + roofHeight * 0.4, -hd));

  // ROOF
  const roofs: THREE.BufferGeometry[] = [];
  const leftRoof = createBox(houseWidth + 0.15, 0.1, houseDepth * 0.8, 0, 0, 0);
  leftRoof.rotateZ(Math.atan2(roofHeight, hw));
  leftRoof.translate(-hw / 2 + 0.12, houseHeight + roofHeight / 2, 0);
  roofs.push(leftRoof);
  const rightRoof = createBox(houseWidth + 0.15, 0.1, houseDepth * 0.8, 0, 0, 0);
  rightRoof.rotateZ(-Math.atan2(roofHeight, hw));
  rightRoof.translate(hw / 2 - 0.12, houseHeight + roofHeight / 2, 0);
  roofs.push(rightRoof);
  // Porch roof
  roofs.push(createBox(1.5, 0.06, 0.6, 0, 1.1, hd + 0.28));

  // TRIM
  const trims: THREE.BufferGeometry[] = [];
  // Chimney
  trims.push(createBox(0.35, 1.0, 0.35, -0.7, 2.4, -0.5));
  trims.push(createBox(0.42, 0.1, 0.42, -0.7, 2.95, -0.5));
  // Porch floor
  trims.push(createBox(1.4, 0.08, 0.5, 0, 0.04, hd + 0.25));
  // Porch columns
  trims.push(createCylinder(0.05, 0.06, 1.0, 8, -0.55, 0.58, hd + 0.45));
  trims.push(createCylinder(0.05, 0.06, 1.0, 8, 0.55, 0.58, hd + 0.45));
  // Door
  trims.push(createBox(0.4, 0.7, 0.05, 0, 0.4, hd + 0.03));

  // ACCENTS (windows)
  const accents: THREE.BufferGeometry[] = [];
  // Ground floor windows
  accents.push(createBox(0.25, 0.35, 0.02, -0.5, 0.5, hd + 0.02));
  accents.push(createBox(0.25, 0.35, 0.02, 0.5, 0.5, hd + 0.02));
  // Upper floor windows
  accents.push(createBox(0.25, 0.35, 0.02, -0.5, 1.0, hd + 0.02));
  accents.push(createBox(0.25, 0.35, 0.02, 0.5, 1.0, hd + 0.02));

  return {
    walls: mergeAndDispose(walls),
    roof: mergeAndDispose(roofs),
    trim: mergeAndDispose(trims),
    accents: mergeAndDispose(accents),
  };
}

// ============================================================
// HOUSE 3 - Victorian style
// ============================================================
export function createHouse3Geometries(): HouseGeometries {
  const mainWidth = 2.0;
  const mainHeight = 1.8;
  const mainDepth = 1.5;
  const hw = mainWidth / 2;
  const hd = mainDepth / 2;

  // WALLS
  const walls: THREE.BufferGeometry[] = [];
  // Main building
  walls.push(createBox(mainWidth, mainHeight, mainDepth, 0, mainHeight / 2, 0));
  // Bay window bump-out
  walls.push(createBox(0.6, 1.2, 0.3, 0.5, 0.7, hd + 0.15));
  // Tower base
  walls.push(createCylinder(0.4, 0.45, mainHeight, 12, -hw - 0.2, mainHeight / 2, hd - 0.3));

  // ROOF
  const roofs: THREE.BufferGeometry[] = [];
  // Main roof
  roofs.push(createBox(mainWidth + 0.2, 0.15, mainDepth + 0.2, 0, mainHeight + 0.5, 0));
  roofs.push(createBox(mainWidth - 0.3, 0.4, mainDepth - 0.3, 0, mainHeight + 0.8, 0));
  // Tower roof (cone)
  roofs.push(createCone(0.5, 0.8, 12, -hw - 0.2, mainHeight + 0.7, hd - 0.3));
  // Bay window roof
  roofs.push(createBox(0.7, 0.1, 0.35, 0.5, 1.35, hd + 0.17));

  // TRIM
  const trims: THREE.BufferGeometry[] = [];
  // Wrap-around porch
  trims.push(createBox(mainWidth + 0.4, 0.08, 0.5, 0, 0.04, hd + 0.25));
  // Porch columns
  const porchColumns = [-0.7, 0, 0.7];
  porchColumns.forEach(x => {
    trims.push(createCylinder(0.06, 0.07, 1.0, 8, x, 0.54, hd + 0.45));
  });
  // Porch roof
  trims.push(createBox(mainWidth + 0.5, 0.08, 0.6, 0, 1.08, hd + 0.3));
  // Chimney
  trims.push(createBox(0.3, 0.8, 0.3, 0.6, mainHeight + 0.9, -0.3));
  // Door
  trims.push(createBox(0.35, 0.65, 0.05, -0.3, 0.37, hd + 0.03));

  // ACCENTS
  const accents: THREE.BufferGeometry[] = [];
  // Windows - first floor
  accents.push(createBox(0.3, 0.4, 0.02, -0.6, 0.5, hd + 0.02));
  accents.push(createBox(0.3, 0.4, 0.02, 0.3, 0.5, hd + 0.02));
  // Windows - second floor
  accents.push(createBox(0.25, 0.35, 0.02, -0.6, 1.3, hd + 0.02));
  accents.push(createBox(0.25, 0.35, 0.02, 0.3, 1.3, hd + 0.02));
  // Tower finial
  accents.push(createSphere(0.08, 8, 8, -hw - 0.2, mainHeight + 1.15, hd - 0.3));

  return {
    walls: mergeAndDispose(walls),
    roof: mergeAndDispose(roofs),
    trim: mergeAndDispose(trims),
    accents: mergeAndDispose(accents),
  };
}

// ============================================================
// HOUSE 4 - Large colonial
// ============================================================
export function createHouse4Geometries(): HouseGeometries {
  const mainWidth = 3.5;
  const mainHeight = 2.2;
  const mainDepth = 2.0;
  const hw = mainWidth / 2;
  const hd = mainDepth / 2;

  // WALLS
  const walls: THREE.BufferGeometry[] = [];
  // Main building
  walls.push(createBox(mainWidth, mainHeight, mainDepth, 0, mainHeight / 2, 0));
  // Side wings
  walls.push(createBox(0.8, mainHeight * 0.8, mainDepth * 0.7, -hw - 0.35, mainHeight * 0.4, 0));
  walls.push(createBox(0.8, mainHeight * 0.8, mainDepth * 0.7, hw + 0.35, mainHeight * 0.4, 0));
  // Entrance portico
  walls.push(createBox(1.2, 0.1, 0.8, 0, mainHeight * 0.75, hd + 0.4));

  // ROOF
  const roofs: THREE.BufferGeometry[] = [];
  // Main hip roof
  roofs.push(createBox(mainWidth + 0.3, 0.2, mainDepth + 0.3, 0, mainHeight + 0.4, 0));
  roofs.push(createBox(mainWidth - 0.5, 0.5, mainDepth - 0.5, 0, mainHeight + 0.75, 0));
  // Wing roofs
  roofs.push(createBox(1.0, 0.15, mainDepth * 0.8, -hw - 0.35, mainHeight * 0.8 + 0.3, 0));
  roofs.push(createBox(1.0, 0.15, mainDepth * 0.8, hw + 0.35, mainHeight * 0.8 + 0.3, 0));
  // Dormer roofs
  const dormerX = [-1.0, 0, 1.0];
  dormerX.forEach(x => {
    roofs.push(createBox(0.5, 0.3, 0.4, x, mainHeight + 0.9, hd - 0.1));
  });

  // TRIM
  const trims: THREE.BufferGeometry[] = [];
  // Grand entrance columns (4)
  const colX = [-0.4, -0.15, 0.15, 0.4];
  colX.forEach(x => {
    trims.push(createCylinder(0.08, 0.1, mainHeight * 0.7, 12, x, mainHeight * 0.35, hd + 0.6));
    // Column capitals
    trims.push(createBox(0.2, 0.1, 0.2, x, mainHeight * 0.72, hd + 0.6));
  });
  // Portico pediment
  trims.push(createBox(1.3, 0.15, 0.1, 0, mainHeight * 0.78, hd + 0.85));
  // Chimneys (2)
  trims.push(createBox(0.35, 0.9, 0.35, -1.2, mainHeight + 1.2, 0));
  trims.push(createBox(0.35, 0.9, 0.35, 1.2, mainHeight + 1.2, 0));
  // Door
  trims.push(createBox(0.5, 0.9, 0.08, 0, 0.5, hd + 0.04));

  // ACCENTS (windows - many!)
  const accents: THREE.BufferGeometry[] = [];
  // First floor windows
  const windowX1 = [-1.3, -0.8, 0.8, 1.3];
  windowX1.forEach(x => {
    accents.push(createBox(0.35, 0.5, 0.02, x, 0.6, hd + 0.02));
  });
  // Second floor windows
  const windowX2 = [-1.3, -0.8, -0.3, 0.3, 0.8, 1.3];
  windowX2.forEach(x => {
    accents.push(createBox(0.3, 0.45, 0.02, x, 1.6, hd + 0.02));
  });
  // Dormer windows
  dormerX.forEach(x => {
    accents.push(createBox(0.25, 0.3, 0.02, x, mainHeight + 0.85, hd + 0.15));
  });
  // Side wing windows
  accents.push(createBox(0.25, 0.4, 0.02, -hw - 0.35, mainHeight * 0.4, hd * 0.7 + 0.4));
  accents.push(createBox(0.25, 0.4, 0.02, hw + 0.35, mainHeight * 0.4, hd * 0.7 + 0.4));

  return {
    walls: mergeAndDispose(walls),
    roof: mergeAndDispose(roofs),
    trim: mergeAndDispose(trims),
    accents: mergeAndDispose(accents),
  };
}

// ============================================================
// HOUSE 5 - Grand mansion with towers
// ============================================================
export function createHouse5Geometries(): HouseGeometries {
  const mainWidth = 6.5;
  const mainHeight = 2.8;
  const mainDepth = 3.0;
  const mansardHeight = 0.9;
  const towerRadius = 0.55;
  const towerHeight = 4.0;
  const hw = mainWidth / 2;
  const hd = mainDepth / 2;

  // Tower positions
  const towerPositions: [number, number][] = [
    [-hw - 0.15, hd + 0.15],
    [hw + 0.15, hd + 0.15],
    [-hw - 0.15, -hd - 0.15],
    [hw + 0.15, -hd - 0.15],
  ];

  // WALLS
  const walls: THREE.BufferGeometry[] = [];
  // Foundation
  walls.push(createBox(mainWidth + 0.4, 0.3, mainDepth + 0.4, 0, 0.15, 0));
  // Main building
  walls.push(createBox(mainWidth, mainHeight, mainDepth, 0, mainHeight / 2 + 0.3, 0));
  // Stone texture lines (horizontal bands)
  [0.6, 1.1, 1.6, 2.1, 2.6].forEach(y => {
    walls.push(createBox(mainWidth + 0.02, 0.02, 0.05, 0, y + 0.3, hd + 0.01));
  });
  // Corner towers - bases and bodies
  towerPositions.forEach(([x, z]) => {
    // Tower base
    walls.push(createCylinder(towerRadius + 0.1, towerRadius + 0.15, 0.4, 16, x, 0.5, z));
    // Tower body
    walls.push(createCylinder(towerRadius, towerRadius + 0.05, towerHeight, 16, x, towerHeight / 2 + 0.3, z));
  });
  // Entrance structure
  const entranceWidth = 1.6;
  const entranceHeight = 2.2;
  const entranceDepth = 0.7;
  walls.push(createBox(entranceWidth, entranceHeight, entranceDepth, 0, entranceHeight / 2 + 0.3, hd + entranceDepth / 2));

  // ROOF
  const roofs: THREE.BufferGeometry[] = [];
  // Mansard roof
  roofs.push(createBox(mainWidth + 0.3, mansardHeight, mainDepth + 0.3, 0, mainHeight + mansardHeight / 2 + 0.3, 0));
  roofs.push(createBox(mainWidth - 0.4, 0.5, mainDepth - 0.4, 0, mainHeight + mansardHeight + 0.55, 0));
  // Roof ridge ornament
  roofs.push(createBox(mainWidth - 0.6, 0.15, 0.15, 0, mainHeight + mansardHeight + 0.88, 0));
  // Tower conical roofs
  towerPositions.forEach(([x, z]) => {
    roofs.push(createCone(towerRadius + 0.2, 1.4, 16, x, towerHeight + 1.0, z));
    // Roof overhang ring
    roofs.push(createTorus(towerRadius + 0.22, 0.06, 8, 24, x, towerHeight + 0.35, z, Math.PI / 2));
  });
  // Dormers
  const dormerX = [-2.2, -1.1, 0, 1.1, 2.2];
  dormerX.forEach(dx => {
    // Dormer body
    roofs.push(createBox(0.5, 0.7, 0.5, dx, mainHeight + 0.65, hd + 0.25));
    // Dormer roof (small pyramid)
    roofs.push(createCone(0.38, 0.45, 4, dx, mainHeight + 1.1, hd + 0.35));
  });

  // TRIM
  const trims: THREE.BufferGeometry[] = [];
  // Tower bands
  towerPositions.forEach(([x, z]) => {
    [1.5, 2.5, 3.5].forEach(bandY => {
      trims.push(createTorus(towerRadius + 0.02, 0.03, 8, 24, x, bandY, z, Math.PI / 2));
    });
  });
  // Entrance columns
  [-0.55, 0.55].forEach(cx => {
    // Column base
    trims.push(createBox(0.25, 0.2, 0.25, cx, 0.4, hd + entranceDepth + 0.15));
    // Column shaft
    trims.push(createCylinder(0.08, 0.1, 1.6, 12, cx, 1.3, hd + entranceDepth + 0.15));
    // Column capital
    trims.push(createBox(0.22, 0.15, 0.22, cx, 2.18, hd + entranceDepth + 0.15));
  });
  // Entrance pediment
  trims.push(createBox(1.85, 0.08, 0.1, 0, entranceHeight + 0.35, hd + entranceDepth + 0.02));
  // Door frame and doors
  trims.push(createBox(1.2, 0.15, 0.15, 0, 1.5, hd + entranceDepth + 0.05));
  // Double doors
  trims.push(createBox(0.45, 1.7, 0.08, -0.27, 0.9, hd + entranceDepth + 0.06));
  trims.push(createBox(0.45, 1.7, 0.08, 0.27, 0.9, hd + entranceDepth + 0.06));

  // ACCENTS (windows, finials, decorations)
  const accents: THREE.BufferGeometry[] = [];
  // Main building windows (8 windows in 2 rows)
  const windowPositions = [
    { x: -2.2, y: 1.0 }, { x: -2.2, y: 2.0 },
    { x: -1.3, y: 1.0 }, { x: -1.3, y: 2.0 },
    { x: 1.3, y: 1.0 }, { x: 1.3, y: 2.0 },
    { x: 2.2, y: 1.0 }, { x: 2.2, y: 2.0 },
  ];
  windowPositions.forEach(({ x, y }) => {
    // Window frame
    accents.push(createBox(0.42, 0.55, 0.06, x, y + 0.3, hd + 0.01));
    // Window glass
    accents.push(createBox(0.36, 0.48, 0.02, x, y + 0.3, hd + 0.02));
  });
  // Tower finials (gold balls and spikes)
  towerPositions.forEach(([x, z]) => {
    accents.push(createSphere(0.08, 8, 8, x, towerHeight + 1.75, z));
    accents.push(createCone(0.04, 0.2, 8, x, towerHeight + 1.95, z));
  });
  // Dormer windows
  dormerX.forEach(dx => {
    accents.push(createBox(0.32, 0.38, 0.08, dx, mainHeight + 0.55, hd + 0.58));
  });
  // Coat of arms on entrance
  accents.push(createCylinder(0.18, 0.18, 0.02, 16, 0, entranceHeight + 0.6, hd + entranceDepth + 0.02));

  return {
    walls: mergeAndDispose(walls),
    roof: mergeAndDispose(roofs),
    trim: mergeAndDispose(trims),
    accents: mergeAndDispose(accents),
  };
}