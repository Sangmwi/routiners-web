/**
 * InBody Types
 *
 * InBody 측정 기록 관련 타입 정의
 * AI Vision API 응답 검증을 위한 Zod 스키마 포함
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas (AI 응답 검증용)
// ============================================================================

/**
 * AI Vision API 응답 검증용 Zod 스키마
 *
 * OpenAI Structured Output에서 사용 (strict: true)
 * - AI는 모든 필드를 반환하되, 값이 없으면 null 반환
 * - 따라서 선택 필드는 .nullable() 사용
 */
export const InBodyExtractedDataSchema = z.object({
  measured_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('측정일 (YYYY-MM-DD 형식)'),

  // 핵심 지표 (필수)
  weight: z
    .number()
    .min(30)
    .max(200)
    .describe('체중 (kg 단위, 숫자만)'),
  skeletal_muscle_mass: z
    .number()
    .min(10)
    .max(80)
    .describe('골격근량 (kg 단위, 숫자만)'),
  body_fat_percentage: z
    .number()
    .min(3)
    .max(60)
    .describe('체지방률 (% 단위, 숫자만)'),
  bmi: z
    .number()
    .min(10)
    .max(50)
    .nullable()
    .describe('BMI (체질량지수, 숫자만)'),
  inbody_score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .describe('인바디 점수 (0-100 정수)'),

  // 체성분 상세 (선택)
  total_body_water: z
    .number()
    .nullable()
    .describe('체수분 (L 단위)'),
  protein: z
    .number()
    .nullable()
    .describe('단백질 (kg 단위)'),
  minerals: z
    .number()
    .nullable()
    .describe('무기질 (kg 단위)'),
  body_fat_mass: z
    .number()
    .nullable()
    .describe('체지방량 (kg 단위)'),

  // 부위별 근육량 (선택)
  right_arm_muscle: z
    .number()
    .nullable()
    .describe('오른팔 근육량 (kg)'),
  left_arm_muscle: z
    .number()
    .nullable()
    .describe('왼팔 근육량 (kg)'),
  trunk_muscle: z
    .number()
    .nullable()
    .describe('몸통 근육량 (kg)'),
  right_leg_muscle: z
    .number()
    .nullable()
    .describe('오른다리 근육량 (kg)'),
  left_leg_muscle: z
    .number()
    .nullable()
    .describe('왼다리 근육량 (kg)'),

  // 부위별 체지방량 (선택)
  right_arm_fat: z
    .number()
    .nullable()
    .describe('오른팔 체지방량 (kg)'),
  left_arm_fat: z
    .number()
    .nullable()
    .describe('왼팔 체지방량 (kg)'),
  trunk_fat: z
    .number()
    .nullable()
    .describe('몸통 체지방량 (kg)'),
  right_leg_fat: z
    .number()
    .nullable()
    .describe('오른다리 체지방량 (kg)'),
  left_leg_fat: z
    .number()
    .nullable()
    .describe('왼다리 체지방량 (kg)'),
});

/** AI에서 추출된 InBody 데이터 타입 (snake_case) */
export type InBodyExtractedData = z.infer<typeof InBodyExtractedDataSchema>;

// ============================================================================
// Database Types (snake_case - DB 직접 사용용)
// ============================================================================

/** DB inbody_records 테이블 Row 타입 */
export interface DbInBodyRecord {
  id: string;
  user_id: string;
  measured_at: string; // DATE as string
  weight: number;
  skeletal_muscle_mass: number;
  body_fat_percentage: number;
  bmi: number | null;
  inbody_score: number | null;
  total_body_water: number | null;
  protein: number | null;
  minerals: number | null;
  body_fat_mass: number | null;
  right_arm_muscle: number | null;
  left_arm_muscle: number | null;
  trunk_muscle: number | null;
  right_leg_muscle: number | null;
  left_leg_muscle: number | null;
  right_arm_fat: number | null;
  left_arm_fat: number | null;
  trunk_fat: number | null;
  right_leg_fat: number | null;
  left_leg_fat: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Domain Types (camelCase - 클라이언트 사용용)
// ============================================================================

/**
 * 클라이언트용 InBody 기록 타입 (camelCase)
 *
 * API 응답에서 사용되는 형태
 */
export interface InBodyRecord {
  id: string;
  userId: string;
  measuredAt: string;

  // 핵심 지표
  weight: number;
  skeletalMuscleMass: number;
  bodyFatPercentage: number;
  bmi?: number;
  inbodyScore?: number;

  // 체성분 상세
  totalBodyWater?: number;
  protein?: number;
  minerals?: number;
  bodyFatMass?: number;

  // 부위별 근육량
  rightArmMuscle?: number;
  leftArmMuscle?: number;
  trunkMuscle?: number;
  rightLegMuscle?: number;
  leftLegMuscle?: number;

  // 부위별 체지방량
  rightArmFat?: number;
  leftArmFat?: number;
  trunkFat?: number;
  rightLegFat?: number;
  leftLegFat?: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * InBody 기록 생성용 데이터 (클라이언트 → API)
 */
export interface InBodyCreateData {
  measuredAt: string;
  weight: number;
  skeletalMuscleMass: number;
  bodyFatPercentage: number;
  bmi?: number;
  inbodyScore?: number;
  totalBodyWater?: number;
  protein?: number;
  minerals?: number;
  bodyFatMass?: number;
  rightArmMuscle?: number;
  leftArmMuscle?: number;
  trunkMuscle?: number;
  rightLegMuscle?: number;
  leftLegMuscle?: number;
  rightArmFat?: number;
  leftArmFat?: number;
  trunkFat?: number;
  rightLegFat?: number;
  leftLegFat?: number;
}

/**
 * InBody 기록 수정용 데이터 (부분 업데이트)
 */
export type InBodyUpdateData = Partial<InBodyCreateData>;

/** InBody 목록 API 페이지네이션 응답 */
export interface InBodyListResponse {
  records: InBodyRecord[];
  page: number;
  hasMore: boolean;
}

// ============================================================================
// Type Transformers
// ============================================================================

/**
 * DbInBodyRecord (snake_case) → InBodyRecord (camelCase) 변환
 */
export function toInBodyRecord(db: DbInBodyRecord): InBodyRecord {
  return {
    id: db.id,
    userId: db.user_id,
    measuredAt: db.measured_at,
    weight: db.weight,
    skeletalMuscleMass: db.skeletal_muscle_mass,
    bodyFatPercentage: db.body_fat_percentage,
    bmi: db.bmi ?? undefined,
    inbodyScore: db.inbody_score ?? undefined,
    totalBodyWater: db.total_body_water ?? undefined,
    protein: db.protein ?? undefined,
    minerals: db.minerals ?? undefined,
    bodyFatMass: db.body_fat_mass ?? undefined,
    rightArmMuscle: db.right_arm_muscle ?? undefined,
    leftArmMuscle: db.left_arm_muscle ?? undefined,
    trunkMuscle: db.trunk_muscle ?? undefined,
    rightLegMuscle: db.right_leg_muscle ?? undefined,
    leftLegMuscle: db.left_leg_muscle ?? undefined,
    rightArmFat: db.right_arm_fat ?? undefined,
    leftArmFat: db.left_arm_fat ?? undefined,
    trunkFat: db.trunk_fat ?? undefined,
    rightLegFat: db.right_leg_fat ?? undefined,
    leftLegFat: db.left_leg_fat ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * InBodyCreateData (camelCase) → DB Insert 데이터 (snake_case) 변환
 *
 * ⚠️ user_id는 DB DEFAULT current_user_id()가 자동 채움
 */
export function transformInBodyToDbInsert(
  data: InBodyCreateData
): Omit<DbInBodyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return {
    measured_at: data.measuredAt,
    weight: data.weight,
    skeletal_muscle_mass: data.skeletalMuscleMass,
    body_fat_percentage: data.bodyFatPercentage,
    bmi: data.bmi ?? null,
    inbody_score: data.inbodyScore ?? null,
    total_body_water: data.totalBodyWater ?? null,
    protein: data.protein ?? null,
    minerals: data.minerals ?? null,
    body_fat_mass: data.bodyFatMass ?? null,
    right_arm_muscle: data.rightArmMuscle ?? null,
    left_arm_muscle: data.leftArmMuscle ?? null,
    trunk_muscle: data.trunkMuscle ?? null,
    right_leg_muscle: data.rightLegMuscle ?? null,
    left_leg_muscle: data.leftLegMuscle ?? null,
    right_arm_fat: data.rightArmFat ?? null,
    left_arm_fat: data.leftArmFat ?? null,
    trunk_fat: data.trunkFat ?? null,
    right_leg_fat: data.rightLegFat ?? null,
    left_leg_fat: data.leftLegFat ?? null,
  };
}

/**
 * AI 추출 데이터 → InBodyCreateData 변환
 */
export function transformExtractedToCreateData(
  extracted: InBodyExtractedData
): InBodyCreateData {
  return {
    measuredAt: extracted.measured_at,
    weight: extracted.weight,
    skeletalMuscleMass: extracted.skeletal_muscle_mass,
    bodyFatPercentage: extracted.body_fat_percentage,
    bmi: extracted.bmi ?? undefined,
    inbodyScore: extracted.inbody_score ?? undefined,
    totalBodyWater: extracted.total_body_water ?? undefined,
    protein: extracted.protein ?? undefined,
    minerals: extracted.minerals ?? undefined,
    bodyFatMass: extracted.body_fat_mass ?? undefined,
    rightArmMuscle: extracted.right_arm_muscle ?? undefined,
    leftArmMuscle: extracted.left_arm_muscle ?? undefined,
    trunkMuscle: extracted.trunk_muscle ?? undefined,
    rightLegMuscle: extracted.right_leg_muscle ?? undefined,
    leftLegMuscle: extracted.left_leg_muscle ?? undefined,
    rightArmFat: extracted.right_arm_fat ?? undefined,
    leftArmFat: extracted.left_arm_fat ?? undefined,
    trunkFat: extracted.trunk_fat ?? undefined,
    rightLegFat: extracted.right_leg_fat ?? undefined,
    leftLegFat: extracted.left_leg_fat ?? undefined,
  };
}

// ============================================================================
// Chart / Summary Types
// ============================================================================

/**
 * InBody 요약 정보 (프로필 표시용)
 */
export interface InBodySummary {
  /** 최신 기록 */
  latest?: InBodyRecord;
  /** 총 기록 수 */
  totalRecords: number;
  /** 이전 기록 대비 변화 */
  changes?: {
    weight: number;
    skeletalMuscleMass: number;
    bodyFatPercentage: number;
    periodDays: number;
  };
  /** 비공개 상태 여부 (타인 프로필 조회 시) */
  isPrivate?: boolean;
}

/**
 * 차트용 데이터 포인트
 */
export interface InBodyChartPoint {
  date: string;
  weight?: number;
  skeletalMuscleMass?: number;
  bodyFatPercentage?: number;
  bmi?: number;
  inbodyScore?: number;
}
