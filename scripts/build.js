#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Simple build script for Webflow CLI compatibility...');

// Step 1: Check if Webflow CLI created a TypeScript config override
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

// Step 2: Run the normal Next.js build (our config prevents standalone mode)
console.log('🏗️ Running Next.js build...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 