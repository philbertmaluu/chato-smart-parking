const isTauriBuild = process.env.NEXT_PUBLIC_TAURI_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for Tauri desktop builds; otherwise keep SSR so API routes work
  ...(isTauriBuild
    ? {
        output: 'export',
        // stable id avoids extra chunk lookups in static mode
        generateBuildId: async () => 'static',
        trailingSlash: true,
      }
    : {}),
  distDir: 'out',
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
