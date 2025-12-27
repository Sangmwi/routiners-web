import {
  getOptimizedImageUrl,
  type ImagePresetName,
  IMAGE_PRESETS,
} from '@/lib/utils/imageOptimization';

/** Supabase 이미지 최적화 URL 생성 */
export function getOptimizedSrc(
  src: string | null | undefined,
  isLocalUrl: boolean | undefined,
  isSupabaseUrl: boolean,
  optimizePreset: ImagePresetName | undefined,
  optimizeWidth: number | undefined
): string | null | undefined {
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
}
