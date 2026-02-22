/**
 * API Response Zod Schemas
 *
 * API 응답 검증을 위한 스키마
 */

import { z } from 'zod';
import { UserSchema } from './user.schema';

// ============================================================================
// Common Response Schemas
// ============================================================================

/**
 * API 에러 응답 스키마
 */
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.string().optional(),
  fieldErrors: z.record(z.string()).optional(),
});

export type ApiErrorResponseSchemaType = z.infer<typeof ApiErrorResponseSchema>;

/**
 * 페이지네이션 메타 스키마
 */
export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

// ============================================================================
// User API Response Schemas
// ============================================================================

/**
 * 현재 사용자 조회 응답
 */
export const GetCurrentUserResponseSchema = UserSchema.nullable();

/**
 * 사용자 프로필 조회 응답
 */
export const GetUserProfileResponseSchema = UserSchema.nullable();

/**
 * 닉네임 중복 확인 응답
 */
export const CheckNicknameResponseSchema = z.object({
  available: z.boolean(),
});

/**
 * 프로필 검색 응답
 */
export const ProfileSearchResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

/**
 * 추천 프로필 응답
 */
export const RecommendedProfilesResponseSchema = z.array(UserSchema);

/**
 * 이미지 업로드 응답
 */
export const ImageUploadResponseSchema = z.object({
  url: z.string().url(),
});

/**
 * 이미지 삭제 응답
 */
export const ImageDeleteResponseSchema = z.object({
  success: z.boolean(),
});

// ============================================================================
// Response Parser Utility
// ============================================================================

/**
 * API 응답을 스키마로 파싱하는 유틸리티
 *
 * @example
 * const user = await parseApiResponse(response, UserSchema);
 */
export async function parseApiResponse<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<T> {
  const data = await response.json();

  const result = schema.safeParse(data);

  if (!result.success) {
    console.error('[API Schema] Validation failed:', {
      url: response.url,
      status: response.status,
      errors: result.error.errors,
      data,
    });

    // 개발 환경에서는 상세 에러, 프로덕션에서는 일반 에러
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        `API response validation failed: ${JSON.stringify(result.error.errors)}`
      );
    }

    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }

  return result.data;
}

/**
 * API 응답을 안전하게 파싱 (실패 시 null)
 */
export async function safeParseApiResponse<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<T | null> {
  try {
    return await parseApiResponse(response, schema);
  } catch {
    return null;
  }
}
