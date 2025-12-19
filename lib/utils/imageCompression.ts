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
    quality = 0.8, // 80% 품질
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Canvas 생성
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
        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // 압축된 파일이 목표 크기보다 큰 경우 품질을 더 낮춤
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.5) {
              // 재귀적으로 품질을 낮춰서 다시 압축
              compressImage(file, {
                ...options,
                quality: quality - 0.1,
              }).then(resolve).catch(reject);
              return;
            }

            // File 객체로 변환
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
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
