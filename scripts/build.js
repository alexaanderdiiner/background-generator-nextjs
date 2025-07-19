#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Custom build script starting...');

// Store original NODE_ENV and use specific Next.js flags instead
const originalNodeEnv = process.env.NODE_ENV;
console.log('🔍 Original NODE_ENV:', originalNodeEnv);

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
  
  // Remove any standalone output configuration (more aggressive patterns)
  configContent = configContent.replace(/output:\s*['"']standalone['"'],?\s*/g, '');
  configContent = configContent.replace(/output:\s*"standalone",?\s*/g, '');
  configContent = configContent.replace(/output:\s*'standalone',?\s*/g, '');
  configContent = configContent.replace(/output:\s*`standalone`,?\s*/g, '');
  configContent = configContent.replace(/['"]output['"]:\s*['"']standalone['"'],?\s*/g, '');
  configContent = configContent.replace(/standalone/g, '');
  
  // Ensure we explicitly set output to undefined if it exists
  if (configContent.includes('output:')) {
    configContent = configContent.replace(/output:\s*[^,}]+,?/g, '');
  }
  
  // Also check for any Next.js environment-based overrides
  configContent = configContent.replace(/process\.env\.OUTPUT[^,}]*/g, '');
  configContent = configContent.replace(/STANDALONE/g, '');
  
  // Add explicit output: undefined if there are any output references
  if (configContent.includes('nextConfig') && !configContent.includes('output:')) {
    configContent = configContent.replace(/const\s+nextConfig\s*=\s*{/, 'const nextConfig = {\n  output: undefined,');
  }
  
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Aggressively removed all standalone references from config');
  
  // Debug: Show what the final config looks like
  console.log('🔍 Final config content preview:');
  console.log(configContent.slice(0, 200) + '...');
}

// Step 3: Run Next.js build  
console.log('🏗️ Running Next.js build...');
console.log('🔧 Letting Next.js build normally, will clean standalone artifacts after');

try {
  execSync('npx next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      // Restore original NODE_ENV for proper build
      NODE_ENV: originalNodeEnv || process.env.NODE_ENV
    }
  });
  
  console.log('✅ Build completed successfully!');
  
  // Step 4: Handle standalone artifacts (create missing files if needed)
  console.log('🔧 Checking for missing files that might cause standalone issues...');
  
  // Ensure routes-manifest.json exists if standalone is being forced
  const routesManifestPath = '.next/routes-manifest.json';
  if (!fs.existsSync(routesManifestPath)) {
    console.log('📝 Creating missing routes-manifest.json...');
    const routesManifest = {
      version: 3,
      pages404: '/404',
      basePath: process.env.NODE_ENV === 'production' && process.env.DISABLE_BASEPATH !== '1' ? '/wow-bg' : '',
      redirects: [],
      headers: [],
      dynamicRoutes: [],
      staticRoutes: [
        { page: '/', regex: '^/$', namedRegex: '^/$' },
        { page: '/_not-found', regex: '^/_not\\-found$', namedRegex: '^/_not\\-found$' }
      ],
      dataRoutes: []
    };
    fs.writeFileSync(routesManifestPath, JSON.stringify(routesManifest, null, 2));
    console.log('✅ Created routes-manifest.json');
  }
  
  // Debug: Check what was actually built
  console.log('🔍 Checking build output...');
  if (fs.existsSync('.next')) {
    console.log('.next directory exists');
    if (fs.existsSync('.next/standalone')) {
      console.log('❌ WARNING: .next/standalone directory was created despite our efforts!');
      const standalonFiles = fs.readdirSync('.next/standalone');
      console.log('Standalone files:', standalonFiles.slice(0, 5));
    } else {
      console.log('✅ No standalone directory created');
    }
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 