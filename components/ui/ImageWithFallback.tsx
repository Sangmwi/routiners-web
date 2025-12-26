'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import {
  getOptimizedImageUrl,
  isSupabaseStorageUrl,
  type ImagePresetName,
  IMAGE_PRESETS,
} from '@/lib/utils/imageOptimization';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  showFallbackIcon?: boolean;
  /** 폴백 UI의 배경 클래스. 기본값은 카드보다 약간 어두운 bg-muted/50 */
  fallbackClassName?: string;
  /** Supabase 이미지 최적화 프리셋 */
  optimizePreset?: ImagePresetName;
  /** 커스텀 최적화 너비 (프리셋 대신 사용) */
  optimizeWidth?: number;
}

/**
 * 이미지 로드 실패 시 폴백을 표시하는 Image 컴포넌트
 *
 * - Data URL / Blob URL: native <img> 사용 (즉시 로드, 최적화 불필요)
 * - Server URL: Next.js Image 사용 (최적화 + 캐싱)
 * - Supabase URL: unoptimized 모드 (프록시 우회)
 */
export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  showFallbackIcon = true,
  fallbackClassName = 'bg-muted/80 border border-border/30',
  className,
  fill,
  sizes,
  optimizePreset,
  optimizeWidth,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevSrcRef = useRef<string | null | undefined>(src);

  // src가 실제로 변경될 때만 상태 초기화
  useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      setError(false);
      // Data URL / Blob URL은 즉시 로드되므로 loading 상태 유지 불필요
      if (src?.startsWith('blob:') || src?.startsWith('data:')) {
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  // URL 타입 감지
  const isLocalUrl = src?.startsWith('blob:') || src?.startsWith('data:');
  const isSupabaseUrl = src ? isSupabaseStorageUrl(src) : false;

  // Supabase 이미지 최적화 적용
  const optimizedSrc = (() => {
    if (!src || isLocalUrl || !isSupabaseUrl) return src;

    // 프리셋 사용
    if (optimizePreset) {
      const preset = IMAGE_PRESETS[optimizePreset];
      return getOptimizedImageUrl(src, {
        width: preset.width,
        height: 'height' in preset ? preset.height : undefined,
        quality: preset.quality,
        format: 'webp',
      });
    }

    // 커스텀 너비 사용
    if (optimizeWidth) {
      return getOptimizedImageUrl(src, { width: optimizeWidth, format: 'webp' });
    }

    // 기본: WebP 변환만
    return getOptimizedImageUrl(src, { format: 'webp', quality: 80 });
  })();

  // src가 없거나 에러 발생 시
  if (!src || error) {
    // fallbackSrc가 있으면 사용
    if (fallbackSrc && !error) {
      return (
        <Image
          {...props}
          src={fallbackSrc}
          alt={alt}
          fill={fill}
          sizes={sizes}
          className={className}
          onError={handleError}
        />
      );
    }

    // 폴백 UI 표시
    if (fill) {
      return (
        <div className={`absolute inset-0 flex items-center justify-center ${fallbackClassName} ${className}`}>
          {showFallbackIcon && (
            <ImageOff className="h-1/3 w-1/3 text-muted-foreground/50" />
          )}
        </div>
      );
    }

    return (
      <div
        className={`flex items-center justify-center ${fallbackClassName} ${className}`}
        style={{
          width: props.width,
          height: props.height,
        }}
      >
        {showFallbackIcon && (
          <ImageOff className="h-1/3 w-1/3 text-muted-foreground/50" />
        )}
      </div>
    );
  }

  // Data URL / Blob URL: native <img> 사용 (Next.js 최적화 우회)
  // 웹뷰에서 Next.js Image의 로컬 URL 처리 문제 해결
  if (isLocalUrl) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className}`}
          style={{ objectFit: 'cover' }}
          onLoad={handleLoad}
          onError={handleError}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={props.width as number}
        height={props.height as number}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  // Supabase URL: 서버사이드 최적화된 URL + native img 사용
  // Next.js Image 프록시 우회하여 직접 로드 (WebView 호환성)
  if (isSupabaseUrl && optimizedSrc) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover ${className} ${loading ? 'bg-muted animate-pulse' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizedSrc}
        alt={alt}
        width={props.width as number}
        height={props.height as number}
        className={`${className} ${loading ? 'bg-muted animate-pulse' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  // 기타 Server URL: Next.js Image 사용
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={`${className} ${loading ? 'bg-muted animate-pulse' : ''}`}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
