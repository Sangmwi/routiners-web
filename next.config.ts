import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler 활성화 (자동 메모이제이션)
  // useCallback, useMemo, React.memo 수동 최적화 불필요
  reactCompiler: true,

  // ============================================================================
  // 번들 최적화
  // ============================================================================

  // 프로덕션 빌드 최적화
  productionBrowserSourceMaps: false, // 소스맵 비활성화 (번들 크기 감소)

  // 실험적 기능
  experimental: {
    // 패키지 최적화 (트리쉐이킹 개선)
    // Next.js가 자동으로 각 아이콘을 개별 import로 변환
    optimizePackageImports: ['@phosphor-icons/react', '@tanstack/react-query', 'zod'],
  },

  // ============================================================================
  // 보안 헤더
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

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google 프로필 이미지
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash 이미지
      },
    ],
    formats: ['image/avif', 'image/webp'], // 최신 이미지 포맷 사용
  },

  // TurboPack 설정
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // webpack 설정
  webpack: (config) => {
    // @ts-expect-error 타입 에러 무시
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
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
            loader: "@svgr/webpack",
            options: {
              typescript: true,
              ext: "tsx",
            },
          },
        ],
      }
    );
    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  },
};

export default nextConfig;
