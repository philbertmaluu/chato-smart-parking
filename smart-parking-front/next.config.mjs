const isTauriBuild = process.env.NEXT_PUBLIC_TAURI_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isTauriBuild ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  turbopack: {},  // Silences Turbopack warnings; keeps webpack for build
  webpack: (config, { isServer }) => {
    if (isTauriBuild && !isServer) {
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

      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
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