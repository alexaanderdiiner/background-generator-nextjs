/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use basePath in production or deployment builds
  ...(process.env.NODE_ENV === 'production' && process.env.DISABLE_BASEPATH !== '1' && {
    basePath: '/wow-bg',          
    assetPrefix: '/wow-bg',
  }),
  // App directory is enabled by default in Next.js 13+
  // Don't use standalone output for OpenNext/Cloudflare compatibility  
  trailingSlash: false
}

module.exports = nextConfig 