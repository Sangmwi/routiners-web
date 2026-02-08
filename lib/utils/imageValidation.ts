/**
 * 이미지 유효성 검증 유틸리티
 *
 * 클라이언트 측 이미지 파일 검증을 담당합니다.
 */

// ============================================================
// Types
// ============================================================

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageValidationOptions {
  /** 최대 파일 크기 (bytes) */
  maxSizeBytes?: number;
  /** 허용 MIME 타입 */
  allowedTypes?: string[];
  /** 허용 확장자 */
  allowedExtensions?: string[];
}

// ============================================================
// Constants
// ============================================================

/** 기본 최대 파일 크기: 10MB */
export const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** 서버 업로드 제한: 5MB */
export const SERVER_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** 허용되는 MIME 타입 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** 허용되는 확장자 */
export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
] as const;

/** HEIC 관련 (지원하지 않음) */
const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

// ============================================================
// Helpers
// ============================================================

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 파일이 HEIC/HEIF 포맷인지 확인
 */
function isHeicFormat(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return (
    HEIC_MIME_TYPES.includes(mimeType) ||
    HEIC_EXTENSIONS.some((ext) => fileName.endsWith(ext))
  );
}

/**
 * 파일이 이미지인지 확인
 */
export function isImageFile(file: File): boolean {
  // MIME 타입으로 체크
  if (file.type.startsWith('image/')) {
    return true;
  }

  // 확장자로 체크 (웹뷰에서 MIME 타입이 비어있을 수 있음)
  const fileName = file.name.toLowerCase();
  const allExtensions = [...ALLOWED_EXTENSIONS, ...HEIC_EXTENSIONS];
  return allExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * 파일 확장자가 허용되는지 확인
 */
function hasAllowedExtension(file: File, allowedExtensions: readonly string[]): boolean {
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * MIME 타입이 허용되는지 확인
 */
function hasAllowedMimeType(file: File, allowedTypes: readonly string[]): boolean {
  // 빈 MIME 타입은 확장자로 판단 (웹뷰 호환)
  if (!file.type) return true;
  return allowedTypes.includes(file.type);
}

// ============================================================
// Main Functions
// ============================================================

/**
 * 이미지 파일 유효성 검증
 *
 * @param file - 검증할 파일
 * @param options - 검증 옵션
 * @returns 검증 결과
 *
 * @example
 * ```ts
 * const result = validateImageFile(file);
 * if (!result.valid) {
 *   showError(result.error);
 *   return;
 * }
 * ```
 */
export function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): ImageValidationResult {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
    allowedTypes = ALLOWED_MIME_TYPES,
    allowedExtensions = ALLOWED_EXTENSIONS,
  } = options;

  // 1. 이미지 파일 여부
  if (!isImageFile(file)) {
    return {
      valid: false,
      error: '이미지 파일만 업로드할 수 있어요. (JPG, PNG, WebP, GIF)',
    };
  }

  // 2. HEIC/HEIF 포맷 체크 (iOS 기본 포맷)
  if (isHeicFormat(file)) {
    return {
      valid: false,
      error:
        'HEIC/HEIF 형식은 지원하지 않아요. iPhone 설정 > 카메라 > 포맷에서 "높은 호환성"을 선택하거나, JPG/PNG로 변환 후 업로드해주세요.',
    };
  }

  // 3. MIME 타입 체크
  if (!hasAllowedMimeType(file, allowedTypes)) {
    return {
      valid: false,
      error: '지원하지 않는 이미지 형식이에요. JPG, PNG, WebP, GIF만 업로드할 수 있어요.',
    };
  }

  // 4. 확장자 체크
  if (!hasAllowedExtension(file, allowedExtensions)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 확장자예요. JPG, PNG, WebP, GIF만 업로드할 수 있어요.',
    };
  }

  // 5. 파일 크기 체크
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `파일 크기는 ${formatFileSize(maxSizeBytes)} 이하여야 해요. 현재: ${formatFileSize(file.size)}`,
    };
  }

  // 6. 서버 업로드 제한 체크
  if (file.size > SERVER_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `파일 크기가 서버 제한(${formatFileSize(SERVER_MAX_SIZE_BYTES)})을 초과합니다. 더 작은 이미지를 선택해주세요.`,
    };
  }

  return { valid: true };
}

/**
 * 여러 파일 한번에 검증
 *
 * @param files - 검증할 파일들
 * @param options - 검증 옵션
 * @returns 모든 파일이 유효하면 { valid: true }, 아니면 첫 번째 에러 반환
 */
export function validateImageFiles(
  files: File[],
  options: ImageValidationOptions = {}
): ImageValidationResult {
  for (const file of files) {
    const result = validateImageFile(file, options);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}
