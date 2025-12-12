const isTauriBuild = process.env.NEXT_PUBLIC_TAURI_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isTauriBuild ? 'export' : undefined, // Only export for Tauri build
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  webpack: (config, { isServer }) => {
    if (isTauriBuild && !isServer) {
      // Remove Node polyfills for fully static client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      // Avoid default/vendor chunk splitting in static export
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
