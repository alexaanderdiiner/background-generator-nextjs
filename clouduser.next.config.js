/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 13+
  output: 'standalone',
  trailingSlash: false,
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig 