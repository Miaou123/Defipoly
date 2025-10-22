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
    return config;
  },
  // Increase timeout for on-demand entries (prevents chunk timeout on idle)
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 seconds (default is 15s)
    pagesBufferLength: 5,
  },
  // Improve dev indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;