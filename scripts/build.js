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

// Step 3: Run Next.js build with error handling
console.log('🏗️ Running Next.js build with standalone mode...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully with standalone output!');
} catch (error) {
  // Check if this is the specific copyfile error we've been seeing
  if (error.message.includes('copyfile') && error.message.includes('routes-manifest.json')) {
    console.log('⚠️ Detected routes-manifest copyfile error - attempting workaround...');
    
    // Create the missing routes-manifest.json in standalone location
    if (fs.existsSync('.next/routes-manifest.json')) {
      const manifestContent = fs.readFileSync('.next/routes-manifest.json', 'utf8');
      fs.writeFileSync('.next/standalone/.next/routes-manifest.json', manifestContent);
      console.log('✅ Manually copied routes-manifest.json to standalone directory');
      
      // Try the build again
      try {
        execSync('npx next build', { stdio: 'inherit' });
        console.log('✅ Build completed successfully after workaround!');
      } catch (secondError) {
        console.error('❌ Build still failed after workaround:', secondError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Build failed and no routes-manifest.json found for workaround');
      process.exit(1);
    }
  } else {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} 