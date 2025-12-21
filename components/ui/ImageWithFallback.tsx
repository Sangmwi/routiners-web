'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  showFallbackIcon?: boolean;
  /** 폴백 UI의 배경 클래스. 기본값은 카드보다 약간 어두운 bg-muted/50 */
  fallbackClassName?: string;
}

/**
 * 이미지 로드 실패 시 폴백을 표시하는 Image 컴포넌트
 *
 * - Blob URL: native <img> 사용 (즉시 로드, 최적화 불필요)
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
      // Blob URL은 즉시 로드되므로 loading 상태 유지 불필요
      if (src?.startsWith('blob:')) {
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
  }, [src]);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  // URL 타입 감지
  const isBlobUrl = src?.startsWith('blob:');
  const isSupabaseUrl = src?.includes('supabase.co/storage');

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

  // Blob URL: native <img> 사용 (Next.js 최적화 우회)
  // 웹뷰에서 Next.js Image의 blob URL 처리 문제 해결
  if (isBlobUrl) {
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

  // Server URL: Next.js Image 사용
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      unoptimized={isSupabaseUrl}
      className={`${className} ${loading ? 'bg-muted animate-pulse' : ''}`}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
