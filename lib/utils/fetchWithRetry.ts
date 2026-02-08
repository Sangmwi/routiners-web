/**
 * 재시도 및 타임아웃이 포함된 Fetch 유틸리티
 */

const DEFAULT_TIMEOUT = 30000; // 30초
const DEFAULT_MAX_RETRIES = 2;

interface FetchWithRetryOptions extends RequestInit {
  timeout?: number;
  maxRetries?: number;
  onRetry?: (retryCount: number) => void;
}

/**
 * 타임아웃이 있는 fetch 함수
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 재시도 로직이 포함된 fetch 함수
 *
 * @example
 * ```ts
 * const response = await fetchWithRetry('/api/upload', {
 *   method: 'POST',
 *   body: formData,
 *   maxRetries: 3,
 *   onRetry: (count) => console.log(`Retry ${count}...`),
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, timeout);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isTimeout = lastError.message === 'TIMEOUT';
      const isNetworkError = error instanceof TypeError;
      const canRetry = (isTimeout || isNetworkError) && attempt < maxRetries;

      if (canRetry) {
        onRetry?.(attempt + 1);
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Unknown fetch error');
}

/**
 * 에러 메시지 생성 유틸리티
 */
export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'TIMEOUT') {
      return '업로드 시간이 초과됐어요. 네트워크 연결을 확인하고 다시 시도해주세요.';
    }
  }

  if (error instanceof TypeError) {
    return '네트워크 연결에 문제가 있어요. 인터넷 연결을 확인해주세요.';
  }

  return '사진 업로드에 실패했어요. 다시 시도해주세요.';
}
