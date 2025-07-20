#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Extract current alpha version number
const currentAlpha = packageJson.alphaVersion || 'v0.5.000';
// Parse version like "v0.5.001" -> extract the last number
const versionMatch = currentAlpha.match(/^v(\d+)\.(\d+)\.(\d+)$/);
if (!versionMatch) {
  console.error('Invalid version format. Expected format: v0.5.001');
  process.exit(1);
}

const major = parseInt(versionMatch[1]);
const minor = parseInt(versionMatch[2]); 
const patch = parseInt(versionMatch[3]);
const newPatch = patch + 1;

// Format with leading zeros (3 digits for patch)
const newAlphaVersion = `v${major}.${minor}.${newPatch.toString().padStart(3, '0')}`;

// Update package.json
packageJson.alphaVersion = newAlphaVersion;

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`🚀 Alpha version updated: ${currentAlpha} → ${newAlphaVersion}`); 