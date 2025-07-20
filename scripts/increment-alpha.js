#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Extract current alpha version number
const currentAlpha = packageJson.alphaVersion || 'alpha.0';
const currentNumber = parseInt(currentAlpha.split('.')[1] || '0');
const newNumber = currentNumber + 1;
const newAlphaVersion = `alpha.${newNumber}`;

// Update package.json
packageJson.alphaVersion = newAlphaVersion;

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`🚀 Alpha version updated: ${currentAlpha} → ${newAlphaVersion}`); 