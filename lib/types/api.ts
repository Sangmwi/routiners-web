/**
 * API 공통 타입 정의
 *
 * 모든 API 응답과 에러 처리를 위한 통일된 타입 시스템
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * API 에러 코드 열거형
 *
 * 클라이언트가 에러 유형을 구분하여 적절히 처리할 수 있도록 함
 */
export type ApiErrorCode =
  // 인증 관련
  | 'UNAUTHORIZED'           // 인증되지 않음 (401)
  | 'FORBIDDEN'              // 권한 없음 (403)
  | 'SESSION_EXPIRED'        // 세션 만료
  | 'INVALID_TOKEN'          // 유효하지 않은 토큰

  // 요청 관련
  | 'BAD_REQUEST'            // 잘못된 요청 (400)
  | 'VALIDATION_ERROR'       // 유효성 검사 실패
  | 'MISSING_FIELD'          // 필수 필드 누락
  | 'INVALID_FORMAT'         // 잘못된 형식

  // 리소스 관련
  | 'NOT_FOUND'              // 리소스 없음 (404)
  | 'ALREADY_EXISTS'         // 이미 존재함 (409)
  | 'CONFLICT'               // 충돌 (409)

  // 서버 관련
  | 'INTERNAL_ERROR'         // 서버 내부 오류 (500)
  | 'SERVICE_UNAVAILABLE'    // 서비스 이용 불가 (503)
  | 'DATABASE_ERROR'         // 데이터베이스 오류

  // 네트워크 관련
  | 'NETWORK_ERROR'          // 네트워크 오류
  | 'TIMEOUT'                // 타임아웃

  // 비즈니스 로직
  | 'NICKNAME_TAKEN'         // 닉네임 중복
  | 'USER_ALREADY_EXISTS'    // 사용자 이미 존재
  | 'INVALID_RANK'           // 잘못된 계급
  | 'IMAGE_UPLOAD_FAILED'    // 이미지 업로드 실패
  | 'MAX_IMAGES_EXCEEDED';   // 최대 이미지 수 초과

/**
 * API 에러 응답 구조
 *
 * 모든 API 에러 응답은 이 형식을 따름
 */
export interface ApiErrorResponse {
  /** 사용자에게 표시할 에러 메시지 */
  error: string;
  /** 프로그래밍 방식 처리를 위한 에러 코드 */
  code?: ApiErrorCode;
  /** 개발 환경에서만 제공되는 상세 정보 */
  details?: string;
  /** 유효성 검사 에러 시 필드별 에러 */
  fieldErrors?: Record<string, string>;
}

/**
 * API 에러 클래스
 *
 * fetch 응답에서 생성되어 클라이언트에서 일관되게 처리 가능
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode = 'INTERNAL_ERROR',
    details?: string,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.fieldErrors = fieldErrors;
  }

  /**
   * fetch Response에서 ApiError 생성
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let errorData: ApiErrorResponse;

    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Request failed with status ${response.status}` };
    }

    const code = errorData.code || statusToErrorCode(response.status);

    return new ApiError(
      errorData.error || 'An error occurred',
      response.status,
      code,
      errorData.details,
      errorData.fieldErrors
    );
  }

  /**
   * 네트워크 에러에서 ApiError 생성
   */
  static fromNetworkError(error: unknown): ApiError {
    const message = error instanceof Error ? error.message : 'Network error';
    return new ApiError(message, 0, 'NETWORK_ERROR');
  }

  /**
   * 인증 관련 에러인지 확인
   */
  isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED' ||
           this.code === 'SESSION_EXPIRED' ||
           this.code === 'INVALID_TOKEN';
  }

  /**
   * 유효성 검사 에러인지 확인
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' ||
           this.code === 'MISSING_FIELD' ||
           this.code === 'INVALID_FORMAT';
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  isRetryable(): boolean {
    return this.code === 'NETWORK_ERROR' ||
           this.code === 'TIMEOUT' ||
           this.code === 'SERVICE_UNAVAILABLE';
  }
}

/**
 * HTTP 상태 코드를 에러 코드로 변환
 */
function statusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 503: return 'SERVICE_UNAVAILABLE';
    default: return 'INTERNAL_ERROR';
  }
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * 성공 응답 래퍼 (페이지네이션 없음)
 */
export interface ApiResponse<T> {
  data: T;
  /** 선택적 메타데이터 */
  meta?: Record<string, unknown>;
}

/**
 * 페이지네이션 정보
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * 페이지네이션된 응답 래퍼
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * 페이지네이션 요청 파라미터
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * 정렬 요청 파라미터
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 에러가 ApiError인지 타입 가드
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 *
 * ApiError인 경우 에러 코드 기반 메시지 반환
 * 그 외에는 fallback 메시지 반환
 */
export function getErrorMessage(
  error: unknown,
  fallback = '요청에 실패했습니다'
): string {
  if (isApiError(error)) {
    return getErrorMessageByCode(error.code);
  }
  return fallback;
}

/**
 * 에러 코드에 따른 사용자 친화적 메시지 반환
 */
export function getErrorMessageByCode(code: ApiErrorCode): string {
  const messages: Record<ApiErrorCode, string> = {
    UNAUTHORIZED: '로그인이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
    SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    INVALID_TOKEN: '인증 정보가 유효하지 않습니다.',
    BAD_REQUEST: '잘못된 요청입니다.',
    VALIDATION_ERROR: '입력 값을 확인해 주세요.',
    MISSING_FIELD: '필수 항목을 입력해 주세요.',
    INVALID_FORMAT: '형식이 올바르지 않습니다.',
    NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
    ALREADY_EXISTS: '이미 존재하는 정보입니다.',
    CONFLICT: '충돌이 발생했습니다.',
    INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    SERVICE_UNAVAILABLE: '서비스를 일시적으로 이용할 수 없습니다.',
    DATABASE_ERROR: '데이터 처리 중 오류가 발생했습니다.',
    NETWORK_ERROR: '네트워크 연결을 확인해 주세요.',
    TIMEOUT: '요청 시간이 초과되었습니다.',
    NICKNAME_TAKEN: '이미 사용 중인 닉네임입니다.',
    USER_ALREADY_EXISTS: '이미 가입된 사용자입니다.',
    INVALID_RANK: '올바른 계급을 선택해 주세요.',
    IMAGE_UPLOAD_FAILED: '이미지 업로드에 실패했습니다.',
    MAX_IMAGES_EXCEEDED: '최대 이미지 개수를 초과했습니다.',
  };

  return messages[code] || '오류가 발생했습니다.';
}
