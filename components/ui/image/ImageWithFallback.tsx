'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
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
  fallbackClassName?: string;
  optimizePreset?: ImagePresetName;
  optimizeWidth?: number;
}

interface ResolvedImageProps extends ImageWithFallbackProps {
  src: string;
}

function ResolvedImage({
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
}: ResolvedImageProps) {
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isBroken, setIsBroken] = useState(false);

  const effectiveSrc = isFallbackMode && fallbackSrc ? fallbackSrc : src;
  const isLocalUrl = effectiveSrc.startsWith('blob:') || effectiveSrc.startsWith('data:');
  const isSupabaseUrl = isSupabaseStorageUrl(effectiveSrc);
  const optimizedSrc = getOptimizedSrc(
    effectiveSrc,
    isLocalUrl,
    isSupabaseUrl,
    optimizePreset,
    optimizeWidth,
  );
  const imageSrc = (isSupabaseUrl ? optimizedSrc : effectiveSrc) ?? effectiveSrc;
  const useNativeImg = isLocalUrl || isSupabaseUrl;
  const [loading, setLoading] = useState(
    !(effectiveSrc.startsWith('blob:') || effectiveSrc.startsWith('data:')),
  );

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);

    if (!isFallbackMode && fallbackSrc) {
      setIsFallbackMode(true);
      return;
    }

    setIsBroken(true);
  };

  if (isBroken) {
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

  return (
    <ImageContainer fill={!!fill} width={props.width} height={props.height} loading={loading}>
      {useNativeImg ? (
        <NativeImage
          src={imageSrc}
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
          src={imageSrc}
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

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  showFallbackIcon = true,
  fallbackClassName = 'bg-muted/80 border border-border/30',
  ...props
}: ImageWithFallbackProps) {
  if (!src) {
    return (
      <FallbackUI
        fill={!!props.fill}
        width={props.width}
        height={props.height}
        showIcon={showFallbackIcon}
        fallbackClassName={fallbackClassName}
        className={props.className}
      />
    );
  }

  return (
    <ResolvedImage
      key={src}
      src={src}
      alt={alt}
      fallbackSrc={fallbackSrc}
      showFallbackIcon={showFallbackIcon}
      fallbackClassName={fallbackClassName}
      {...props}
    />
  );
}
