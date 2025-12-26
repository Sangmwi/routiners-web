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

  // 모듈 번들링 최적화
  modularizeImports: {
    // lucide-react 트리쉐이킹 최적화
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },

  // 실험적 기능
  experimental: {
    // 패키지 최적화 (트리쉐이킹 개선)
    optimizePackageImports: ['lucide-react', '@tanstack/react-query', 'zod'],
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 모든 HTTPS 도메인 허용 (개발 단계)
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
