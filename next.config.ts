import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Compiler (automatic memoization)
  // In web app, avoid manual useCallback/useMemo optimizations
  reactCompiler: true,

  // ============================================================================
  // Bundle optimization
  // ============================================================================
  productionBrowserSourceMaps: false, // Reduce production bundle size

  experimental: {
    // Optimize frequently used package imports automatically
    optimizePackageImports: ['@phosphor-icons/react', '@tanstack/react-query', 'zod'],
  },

  // ============================================================================
  // Security headers
  // ============================================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile images
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash images
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern image formats
  },

  // Turbopack settings
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // webpack settings
  webpack: (config) => {
    // @ts-expect-error broad runtime shape for module rule lookup
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              typescript: true,
              ext: 'tsx',
            },
          },
        ],
      },
    );
    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  },
};

export default nextConfig;