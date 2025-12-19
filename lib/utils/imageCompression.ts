/**
 * 이미지 압축 유틸리티
 *
 * 모바일 네트워크에서 업로드 성능을 향상시키기 위해
 * 클라이언트 측에서 이미지를 압축합니다.
 */

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

const MAX_COMPRESSION_RETRIES = 3;

/**
 * Blob을 압축된 Blob으로 변환합니다. (내부 헬퍼)
 */
function compressBlob(
  img: HTMLImageElement,
  maxWidthOrHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not supported'));
        return;
      }

      // 리사이징 비율 계산
      let { width, height } = img;

      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = (height / width) * maxWidthOrHeight;
          width = maxWidthOrHeight;
        } else {
          width = (width / height) * maxWidthOrHeight;
          height = maxWidthOrHeight;
        }
      }

      // Canvas 크기 설정
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 이미지 파일을 압축합니다.
 *
 * @param file - 압축할 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1, // 1MB 제한
    maxWidthOrHeight = 1920, // 1920px 제한
    quality: initialQuality = 0.8, // 80% 품질
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Canvas API 지원 확인
  if (typeof document === 'undefined' || !document.createElement) {
    console.warn('Canvas API not supported, returning original file');
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        try {
          let quality = initialQuality;
          let retries = 0;
          let blob: Blob | null = null;

          // 품질을 낮추면서 목표 크기 달성할 때까지 반복
          while (retries < MAX_COMPRESSION_RETRIES) {
            blob = await compressBlob(img, maxWidthOrHeight, quality);

            // 목표 크기 달성 또는 최소 품질 도달
            if (blob.size <= maxSizeBytes || quality <= 0.5) {
              break;
            }

            // 품질 낮추고 재시도
            quality -= 0.15;
            retries++;
            console.log(`압축 재시도 (${retries}/${MAX_COMPRESSION_RETRIES}): quality=${quality.toFixed(2)}`);
          }

          if (!blob) {
            reject(new Error('Failed to compress image after retries'));
            return;
          }

          // 압축 후에도 너무 크면 경고 로그 (업로드는 진행)
          if (blob.size > maxSizeBytes) {
            console.warn(`압축 후에도 파일이 ${formatFileSize(blob.size)}입니다. 서버 업로드를 진행합니다.`);
          }

          // File 객체로 변환
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        } catch (error) {
          console.error('Compression error:', error);
          // 압축 실패 시 원본 파일 반환 (업로드 시도는 계속)
          console.warn('압축 실패, 원본 파일로 업로드를 시도합니다.');
          resolve(file);
        }
      };

      img.onerror = () => {
        // 이미지 로드 실패 시에도 원본 파일 반환
        console.warn('이미지 로드 실패, 원본 파일로 업로드를 시도합니다.');
        resolve(file);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      // 파일 읽기 실패 시에도 원본 파일 반환
      console.warn('파일 읽기 실패, 원본 파일로 업로드를 시도합니다.');
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 파일이 이미지인지 확인합니다.
 *
 * @param file - 확인할 파일
 * @returns 이미지 여부
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환합니다.
 *
 * @param bytes - 바이트 단위 크기
 * @returns 포맷된 문자열 (예: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
