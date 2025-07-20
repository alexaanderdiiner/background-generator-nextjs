#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Simplified build script working WITH standalone mode...');

// Step 1: Handle Webflow CLI config override
if (fs.existsSync('next.config.ts')) {
  console.log('🔄 Found Webflow CLI TypeScript config override, replacing with our config...');
  
  // Remove the TypeScript config
  fs.unlinkSync('next.config.ts');
  
  // Restore our config from backup if it exists
  if (fs.existsSync('clouduser.next.config.js')) {
    fs.copyFileSync('clouduser.next.config.js', 'next.config.js');
    console.log('✅ Restored our next.config.js from backup');
  } else {
    console.log('⚠️ No backup found, using existing next.config.js');
  }
}

// Step 2: Pre-create standalone directory structure for Webflow compatibility
console.log('🔧 Pre-creating standalone structure for Webflow deployment...');
const standaloneDirs = [
  '.next/standalone',
  '.next/standalone/.next',
  '.next/standalone/node_modules'
];

standaloneDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Step 3: Run Next.js build with comprehensive error handling
console.log('🏗️ Running Next.js build with standalone mode...');

// Create default routes-manifest.json if it doesn't exist (Webflow compatibility)
const routesManifestPath = '.next/routes-manifest.json';
const defaultManifest = {
  "version": 3,
  "pages404": true,
  "basePath": "",
  "redirects": [],
  "rewrites": {
    "beforeFiles": [],
    "afterFiles": [],
    "fallback": []
  },
  "headers": []
};

try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully with standalone output!');
} catch (error) {
  console.log('⚠️ Build failed, attempting routes-manifest workaround...');
  
  // Always create routes-manifest.json if it doesn't exist
  if (!fs.existsSync(routesManifestPath)) {
    console.log('📝 Creating missing routes-manifest.json file...');
    fs.writeFileSync(routesManifestPath, JSON.stringify(defaultManifest, null, 2));
  }
  
  // Ensure standalone directory exists with proper structure
  const standaloneManifestPath = '.next/standalone/.next/routes-manifest.json';
  const standaloneDir = '.next/standalone/.next';
  
  if (!fs.existsSync(standaloneDir)) {
    fs.mkdirSync(standaloneDir, { recursive: true });
  }
  
  // Copy manifest to standalone location
  if (fs.existsSync(routesManifestPath)) {
    fs.copyFileSync(routesManifestPath, standaloneManifestPath);
    console.log('✅ Copied routes-manifest.json to standalone directory');
  }
  
  // Try the build again with workaround in place
  try {
    execSync('npx next build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully after workaround!');
  } catch (secondError) {
    console.error('❌ Build still failed after workaround:', secondError.message);
    process.exit(1);
  }
} 