/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static export to enable API routes
  // output: 'export', // Commented out to enable API routes for camera streaming
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
