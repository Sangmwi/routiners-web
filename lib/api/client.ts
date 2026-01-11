/**
 * API Client
 *
 * authFetch를 래핑하여 공통 응답 처리를 추상화
 * - JSON 헤더 자동 설정
 * - 에러 응답 → ApiError 변환
 * - 404 응답 → null 반환 옵션
 *
 * @example
 * ```ts
 * // GET (404 → null)
 * const user = await api.get<User>('/api/user/me');
 *
 * // POST with body
 * const record = await api.post<InBodyRecord>('/api/inbody', data);
 *
 * // PATCH
 * const updated = await api.patch<User>('/api/user/profile', data);
 *
 * // DELETE
 * await api.delete('/api/inbody/123');
 * ```
 */

import { authFetch } from '@/lib/utils/authFetch';
import { ApiError } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  /** 404 응답 시 null 반환 (기본: true for GET, false for others) */
  nullOn404?: boolean;
  /** Content-Type 헤더 (기본: application/json) */
  contentType?: string;
  /** 추가 헤더 */
  headers?: Record<string, string>;
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  /**
   * 기본 요청 실행
   */
  private async request<T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T | null> {
    const { nullOn404 = method === 'GET', contentType, headers = {} } = options;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...(contentType !== undefined
          ? { 'Content-Type': contentType }
          : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    };

    if (body !== undefined) {
      fetchOptions.body =
        body instanceof FormData ? body : JSON.stringify(body);

      // FormData의 경우 Content-Type 헤더 제거 (브라우저가 boundary 포함하여 자동 설정)
      if (body instanceof FormData) {
        delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
      }
    }

    const response = await authFetch(url, fetchOptions);

    // 404 처리
    if (response.status === 404 && nullOn404) {
      return null;
    }

    // 에러 처리
    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    // 204 No Content 처리
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * GET 요청
   * @returns T | null (404 시 null)
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T | null> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * GET 요청 (404 시 에러 throw)
   * @throws {ApiError} 404 포함 모든 에러
   */
  async getOrThrow<T>(url: string, options?: RequestOptions): Promise<T> {
    const result = await this.request<T>('GET', url, undefined, {
      ...options,
      nullOn404: false,
    });
    return result as T;
  }

  /**
   * POST 요청
   */
  async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const result = await this.request<T>('POST', url, body, {
      ...options,
      nullOn404: false,
    });
    return result as T;
  }

  /**
   * PUT 요청
   */
  async put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const result = await this.request<T>('PUT', url, body, {
      ...options,
      nullOn404: false,
    });
    return result as T;
  }

  /**
   * PATCH 요청
   */
  async patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const result = await this.request<T>('PATCH', url, body, {
      ...options,
      nullOn404: false,
    });
    return result as T;
  }

  /**
   * DELETE 요청
   */
  async delete<T = void>(url: string, options?: RequestOptions): Promise<T | null> {
    return this.request<T>('DELETE', url, undefined, {
      ...options,
      nullOn404: false,
    });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const api = new ApiClient();
