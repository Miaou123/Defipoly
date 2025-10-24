#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const idlPath = join(__dirname, '../target/idl/defipoly_program.json');
const frontendPath = join(__dirname, '../../defipoly-frontend/src/idl/defipoly_program.json');
const backendPath = join(__dirname, '../../defipoly-backend/src/idl/defipoly_program.json');

// Copy to frontend
try {
  mkdirSync(dirname(frontendPath), { recursive: true });
  copyFileSync(idlPath, frontendPath);
  console.log('✅ IDL copied to frontend');
} catch (e) {
  console.log('⚠️  Frontend not found, skipping');
}

// Copy to backend
try {
  mkdirSync(dirname(backendPath), { recursive: true });
  copyFileSync(idlPath, backendPath);
  console.log('✅ IDL copied to backend');
} catch (e) {
  console.log('⚠️  Backend not found, skipping');
}
