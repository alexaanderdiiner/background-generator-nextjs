/** @type {import('next').NextConfig} */
const nextConfig = {
  // Conditionally disable basePath for OpenNext builds
  ...(process.env.DISABLE_BASEPATH !== '1' && {
    basePath: '/wow-bg',          
    assetPrefix: '/wow-bg',
  }),
  // App directory is enabled by default in Next.js 13+
  // Don't use standalone output for OpenNext/Cloudflare compatibility  
  trailingSlash: false
}

module.exports = nextConfig 