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

// Step 2: Run Next.js build (now allowing standalone mode)
console.log('🏗️ Running Next.js build with standalone mode...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully with standalone output!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 