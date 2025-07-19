#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Custom build script starting...');

// Set Wrangler environment flags for Node-style builds (Webflow Cloud compatibility)
process.env.WRANGLER_BUILD_CONDITIONS = "";
process.env.WRANGLER_BUILD_PLATFORM = "node";
console.log('✅ Set Wrangler build flags for Node.js compatibility');

// Step 1: Handle Webflow CLI config override
if (fs.existsSync('next.config.ts')) {
  console.log('📋 Found Webflow CLI generated next.config.ts, replacing with our config...');
  
  // Copy our config over Webflow's
  if (fs.existsSync('clouduser.next.config.js')) {
    fs.copyFileSync('clouduser.next.config.js', 'next.config.js');
  }
  
  // Remove the TypeScript config
  fs.unlinkSync('next.config.ts');
  console.log('✅ Replaced config successfully');
} else {
  console.log('📋 Using existing next.config.js');
}

// Step 2: Ensure our config doesn't have standalone output
const configPath = 'next.config.js';
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Remove any standalone output configuration
  configContent = configContent.replace(/output:\s*['"']standalone['"'],?\s*/g, '');
  configContent = configContent.replace(/output:\s*"standalone",?\s*/g, '');
  configContent = configContent.replace(/output:\s*'standalone',?\s*/g, '');
  
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Ensured no standalone output in config');
}

// Step 3: Run Next.js build
console.log('🏗️ Running Next.js build...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 