'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { isSupabaseStorageUrl, type ImagePresetName } from '@/lib/utils/imageOptimization';
import { ImageContainer } from './ImageContainer';
import { FallbackUI } from './FallbackUI';
import { NativeImage } from './NativeImage';
import { getOptimizedSrc } from './getOptimizedSrc';

export interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  showFallbackIcon?: boolean;
  /** 폴백 UI의 배경 클래스 */
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
 * - Supabase URL: 서버사이드 최적화 + native img (프록시 우회)
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
      setLoading(!(src?.startsWith('blob:') || src?.startsWith('data:')));
    }
  }, [src]);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  // URL 타입 분석
  const isLocalUrl = src?.startsWith('blob:') || src?.startsWith('data:');
  const isSupabaseUrl = src ? isSupabaseStorageUrl(src) : false;

  // Supabase 이미지 최적화 URL 생성
  const optimizedSrc = getOptimizedSrc(src, isLocalUrl, isSupabaseUrl, optimizePreset, optimizeWidth);

  // 이미지 렌더링에 사용할 실제 src 결정
  const imageSrc = isSupabaseUrl ? optimizedSrc : src;

  // native img 사용 여부 (Local URL 또는 Supabase URL)
  const useNativeImg = isLocalUrl || isSupabaseUrl;

  // 1. src가 없거나 에러 발생 시 폴백 처리
  if (!src || error) {
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

    return (
      <FallbackUI
        fill={!!fill}
        width={props.width}
        height={props.height}
        showIcon={showFallbackIcon}
        fallbackClassName={fallbackClassName}
        className={className}
      />
    );
  }

  // 2. 정상 이미지 렌더링
  return (
    <ImageContainer fill={!!fill} width={props.width} height={props.height} loading={loading}>
      {useNativeImg ? (
        <NativeImage
          src={imageSrc!}
          alt={alt}
          fill={!!fill}
          width={props.width as number}
          height={props.height as number}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <Image
          {...props}
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </ImageContainer>
  );
}
