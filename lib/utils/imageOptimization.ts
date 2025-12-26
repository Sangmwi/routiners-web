/**
 * Image Optimization Utilities
 *
 * Supabase Storage Transform을 활용한 서버사이드 이미지 최적화
 * WebView에서 next/image 대신 사용
 */

// ============================================================================
// Types
// ============================================================================

interface ImageTransformOptions {
  /** 너비 (px) */
  width?: number;
  /** 높이 (px) */
  height?: number;
  /** 리사이즈 모드 */
  resize?: 'cover' | 'contain' | 'fill';
  /** 이미지 포맷 */
  format?: 'origin' | 'webp' | 'avif';
  /** 이미지 품질 (1-100) */
  quality?: number;
}

interface ImageSizePreset {
  width: number;
  height?: number;
  quality: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 이미지 크기 프리셋
 */
export const IMAGE_PRESETS = {
  /** 썸네일 (목록용) */
  thumbnail: { width: 100, quality: 70 },
  /** 프로필 작은 아바타 */
  avatarSmall: { width: 48, height: 48, quality: 80 },
  /** 프로필 중간 아바타 */
  avatarMedium: { width: 96, height: 96, quality: 80 },
  /** 프로필 큰 아바타 */
  avatarLarge: { width: 200, height: 200, quality: 85 },
  /** 카드 이미지 */
  card: { width: 300, quality: 80 },
  /** 상세 페이지 이미지 */
  detail: { width: 600, quality: 85 },
  /** 전체 화면 이미지 */
  fullscreen: { width: 1080, quality: 90 },
} as const satisfies Record<string, ImageSizePreset>;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;

// ============================================================================
// URL Builders
// ============================================================================

/**
 * Supabase Storage 이미지 URL인지 확인
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('/storage/');
}

/**
 * Supabase Storage Transform URL 생성
 *
 * @example
 * const optimizedUrl = getOptimizedImageUrl(originalUrl, { width: 300, format: 'webp' });
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return '';

  // Supabase Storage URL이 아니면 원본 반환
  if (!isSupabaseStorageUrl(url)) {
    return url;
  }

  const {
    width,
    height,
    resize = 'cover',
    format = 'webp',
    quality = 80,
  } = options;

  // URL 파싱
  const urlObj = new URL(url);

  // 이미 transform 파라미터가 있으면 제거
  urlObj.searchParams.delete('width');
  urlObj.searchParams.delete('height');
  urlObj.searchParams.delete('resize');
  urlObj.searchParams.delete('format');
  urlObj.searchParams.delete('quality');

  // Transform 파라미터 추가
  if (width) urlObj.searchParams.set('width', width.toString());
  if (height) urlObj.searchParams.set('height', height.toString());
  urlObj.searchParams.set('resize', resize);
  if (format !== 'origin') urlObj.searchParams.set('format', format);
  urlObj.searchParams.set('quality', quality.toString());

  return urlObj.toString();
}

/**
 * 프리셋 기반 최적화 URL 생성
 *
 * @example
 * const thumbnailUrl = getPresetImageUrl(originalUrl, 'thumbnail');
 */
export function getPresetImageUrl(
  url: string,
  preset: ImagePresetName
): string {
  const presetConfig = IMAGE_PRESETS[preset];

  return getOptimizedImageUrl(url, {
    width: presetConfig.width,
    height: presetConfig.height,
    quality: presetConfig.quality,
    format: 'webp',
  });
}

/**
 * 반응형 이미지 소스셋 생성
 *
 * @example
 * const srcset = getResponsiveSrcSet(url, [300, 600, 900]);
 * // "url?width=300 300w, url?width=600 600w, url?width=900 900w"
 */
export function getResponsiveSrcSet(
  url: string,
  widths: number[] = [300, 600, 900, 1200]
): string {
  if (!isSupabaseStorageUrl(url)) {
    return '';
  }

  return widths
    .map((width) => {
      const optimizedUrl = getOptimizedImageUrl(url, { width, format: 'webp' });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

// ============================================================================
// Fallback & Error Handling
// ============================================================================

/** 기본 프로필 이미지 */
export const DEFAULT_PROFILE_IMAGE = '/images/default-profile.png';

/** 기본 상품 이미지 */
export const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';

/**
 * 이미지 URL이 유효한지 확인하고 폴백 반환
 */
export function getImageWithFallback(
  url: string | null | undefined,
  fallback: string = DEFAULT_PROFILE_IMAGE
): string {
  if (!url || url.trim() === '') {
    return fallback;
  }
  return url;
}

/**
 * 프로필 이미지 배열에서 첫 번째 이미지 또는 폴백
 */
export function getProfileImage(
  images: string[] | null | undefined,
  fallback: string = DEFAULT_PROFILE_IMAGE
): string {
  if (!images || images.length === 0) {
    return fallback;
  }
  return images[0];
}

// ============================================================================
// Image Helpers
// ============================================================================

/**
 * 이미지 비율 계산 (aspect-ratio CSS용)
 */
export function getAspectRatio(
  width: number,
  height: number
): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

/**
 * 이미지 파일 크기 검증
 *
 * @param file - 검사할 파일
 * @param maxSizeMB - 최대 크기 (MB)
 */
export function validateImageSize(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `이미지 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
    };
  }

  return { valid: true };
}

/**
 * 이미지 파일 타입 검증
 */
export function validateImageType(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'JPG, PNG, WebP, GIF 형식만 지원됩니다.',
    };
  }

  return { valid: true };
}
