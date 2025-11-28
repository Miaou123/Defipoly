import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Webpack configuration for better HMR and chunk loading
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve watch options for development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Handle three.js and R3F modules
    if (!isServer) {
      config.externals = config.externals || [];
      config.resolve.alias = {
        ...config.resolve.alias,
        three: 'three',
      };
    }

    // Split Three.js into a shared vendor chunk instead of duplicating
    config.optimization = config.optimization || {};
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        three: {
          test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
          name: 'three-vendor',
          chunks: 'all',
          priority: 10,
        },
      },
    };
    
    return config;
  },
  // Increase timeout for on-demand entries (prevents chunk timeout on idle)
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 seconds (default is 15s)
    pagesBufferLength: 5,
  },
  // Add experimental features for better chunk loading
  experimental: {
    esmExternals: 'loose',
  }
};

export default nextConfig;