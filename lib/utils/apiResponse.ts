/**
 * API Response Utilities
 *
 * 표준화된 API 응답 헬퍼 함수들
 * 모든 API 라우트에서 일관된 응답 형식 보장
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ApiErrorCode;
  fieldErrors?: Record<string, string>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Success Response Helpers
// ============================================================================

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 페이지네이션 성공 응답
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  },
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...pagination,
    },
    { status }
  );
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: string,
  code: ApiErrorCode,
  status: number,
  fieldErrors?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    code,
  };

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    response.fieldErrors = fieldErrors;
  }

  return NextResponse.json(response, { status });
}

/**
 * 400 Bad Request
 */
export function badRequest(
  message: string = '잘못된 요청입니다',
  fieldErrors?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'BAD_REQUEST', 400, fieldErrors);
}

/**
 * 401 Unauthorized
 */
export function unauthorized(
  message: string = '인증이 필요합니다'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'UNAUTHORIZED', 401);
}

/**
 * 403 Forbidden
 */
export function forbidden(
  message: string = '접근 권한이 없습니다'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'FORBIDDEN', 403);
}

/**
 * 404 Not Found
 */
export function notFound(
  message: string = '리소스를 찾을 수 없습니다'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'NOT_FOUND', 404);
}

/**
 * 409 Conflict
 */
export function conflict(
  message: string = '리소스 충돌이 발생했습니다'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'CONFLICT', 409);
}

/**
 * 500 Internal Server Error
 */
export function internalError(
  message: string = '서버 오류가 발생했습니다'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'INTERNAL_ERROR', 500);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Zod 에러를 필드별 메시지로 변환
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.errors) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

/**
 * Zod 검증 에러 응답
 */
export function validationError(
  zodError: ZodError
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    '입력값이 올바르지 않습니다',
    'VALIDATION_ERROR',
    400,
    formatZodErrors(zodError)
  );
}

// ============================================================================
// Error Handling Helpers
// ============================================================================

/**
 * Supabase 에러 코드 기반 응답 생성
 */
export function handleSupabaseError(error: {
  code?: string;
  message?: string;
}): NextResponse<ApiErrorResponse> {
  // PGRST116: Row not found
  if (error.code === 'PGRST116') {
    return notFound('데이터를 찾을 수 없습니다');
  }

  // 23505: Unique constraint violation
  if (error.code === '23505') {
    return conflict('이미 존재하는 데이터입니다');
  }

  // 23503: Foreign key violation
  if (error.code === '23503') {
    return badRequest('잘못된 참조입니다');
  }

  // Default
  console.error('[Supabase Error]', error);
  return internalError();
}

/**
 * 일반 에러 핸들링
 */
export function handleError(
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  // Zod validation error
  if (error instanceof ZodError) {
    return validationError(error);
  }

  // Supabase error
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return handleSupabaseError(error as { code?: string; message?: string });
  }

  // Log unexpected errors
  console.error(`[API Error]${context ? ` ${context}` : ''}`, error);
  return internalError();
}
