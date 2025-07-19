/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ACCEPT: Work WITH standalone mode since Next.js insists on it
  
  // Only use basePath in production or deployment builds
  ...(process.env.NODE_ENV === 'production' && process.env.DISABLE_BASEPATH !== '1' && {
    basePath: '/wow-bg',          
    assetPrefix: '/wow-bg',
  }),
  // App directory is enabled by default in Next.js 13+
  // Don't use for OpenNext/Cloudflare compatibility  
  trailingSlash: false
}

module.exports = nextConfig 