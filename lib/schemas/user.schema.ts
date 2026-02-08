/**
 * User Zod Schemas
 *
 * 사용자 관련 데이터 유효성 검사 스키마
 * Database 스키마와 동기화 유지 필요
 */

import { z } from 'zod';

// ============================================================================
// Enums & Constants
// ============================================================================

export const GenderSchema = z.enum(['male', 'female']);

export const RankSchema = z.enum(['이병', '일병', '상병', '병장']);

export const SpecialtySchema = z.enum([
  '보병',
  '포병',
  '기갑',
  '공병',
  '정보통신',
  '항공',
  '화생방',
  '병참',
  '의무',
  '법무',
  '행정',
  '기타',
]);

// ============================================================================
// User Schema
// ============================================================================

/**
 * 전체 User 스키마 (API 응답용)
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string(),
  email: z.string().email(),
  realName: z.string().min(1),
  phoneNumber: z.string(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  gender: GenderSchema,
  nickname: z.string().min(2).max(20),
  enlistmentMonth: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  rank: RankSchema,
  unitId: z.string(),
  unitName: z.string(),
  specialty: SpecialtySchema,

  // Optional profile fields
  profileImages: z.array(z.string().url()).max(4).optional(),
  bio: z.string().max(500).optional(),
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(200).optional(),
  muscleMass: z.number().min(0).max(100).optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  interestedLocations: z.array(z.string()).optional(),
  interestedExercises: z.array(z.string()).optional(),
  isSmoker: z.boolean().optional(),
  showInbodyPublic: z.boolean().optional(),

  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type UserSchemaType = z.infer<typeof UserSchema>;

// ============================================================================
// Profile Update Schema
// ============================================================================

/**
 * 프로필 업데이트 스키마 (부분 업데이트)
 */
export const ProfileUpdateSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  profileImages: z.array(z.string().url()).max(4).optional(),
  bio: z.string().max(500).optional(),
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(200).optional(),
  muscleMass: z.number().min(0).max(100).optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  interestedLocations: z.array(z.string()).optional(),
  interestedExercises: z.array(z.string()).optional(),
  isSmoker: z.boolean().optional(),
  showInbodyPublic: z.boolean().optional(),
});

export type ProfileUpdateSchemaType = z.infer<typeof ProfileUpdateSchema>;

// ============================================================================
// Signup Schemas
// ============================================================================

/**
 * PASS 본인인증 스키마 (Step 1)
 */
export const PassVerificationSchema = z.object({
  realName: z.string().min(2, '이름을 입력해주세요'),
  phoneNumber: z
    .string()
    .regex(/^01[016789]\d{7,8}$/, '올바른 휴대폰 번호를 입력해주세요'),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 생년월일 형식이 아닙니다'),
  gender: GenderSchema,
});

export type PassVerificationSchemaType = z.infer<typeof PassVerificationSchema>;

/**
 * 군인정보 스키마 (Step 2)
 */
export const MilitaryInfoSchema = z.object({
  enlistmentMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '입대월을 선택해주세요'),
  rank: RankSchema,
  unitId: z.string().min(1, '부대를 선택해주세요'),
  unitName: z.string().min(1),
  specialty: SpecialtySchema,
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 해요')
    .max(20, '닉네임은 20자 이하여야 해요')
    .regex(/^[가-힣a-zA-Z0-9_]+$/, '한글, 영문, 숫자, 밑줄만 사용 가능해요'),
});

export type MilitaryInfoSchemaType = z.infer<typeof MilitaryInfoSchema>;

/**
 * 회원가입 완료 스키마 (전체)
 */
export const SignupCompleteSchema = PassVerificationSchema.merge(MilitaryInfoSchema);

export type SignupCompleteSchemaType = z.infer<typeof SignupCompleteSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * 스키마로 데이터 파싱 (실패 시 null 반환)
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('[Schema] Validation failed:', result.error.errors);
  return null;
}

/**
 * 스키마로 데이터 파싱 (실패 시 에러 throw)
 */
export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Zod 에러를 필드별 메시지로 변환
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.errors) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}
