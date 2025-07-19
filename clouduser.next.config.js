/** @type {import('next').NextConfig} */
const nextConfig = {
  // Always use basePath in clouduser config (deployment only)
  basePath: '/wow-bg',          
  assetPrefix: '/wow-bg',
  // App directory is enabled by default in Next.js 13+
  // Don't use standalone output for OpenNext/Cloudflare compatibility  
  trailingSlash: false
}

module.exports = nextConfig 