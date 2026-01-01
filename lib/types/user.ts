/**
 * User Types
 *
 * Database 스키마(lib/database.types.ts)에서 파생된 타입들
 * snake_case → camelCase 변환은 API 레이어에서 수행
 *
 * 타입 동기화:
 * 1. Supabase 스키마 변경 시 `npm run db:types` 실행
 * 2. 필드 추가/변경 시 아래 타입도 함께 수정
 */

import type { Tables } from '@/lib/database.types';

// ============================================================================
// Database Row Type (snake_case - DB 직접 사용용)
// ============================================================================

/** DB users 테이블 Row 타입 */
export type DbUser = Tables<'users'>;

// ============================================================================
// Domain Types (camelCase - 클라이언트 사용용)
// ============================================================================

export type Gender = 'male' | 'female';

export type Rank = '이병' | '일병' | '상병' | '병장';

export type Specialty =
  | '보병'
  | '포병'
  | '기갑'
  | '공병'
  | '정보통신'
  | '항공'
  | '화생방'
  | '병참'
  | '의무'
  | '법무'
  | '행정'
  | '기타';

export interface Unit {
  id: string;
  name: string;
  location?: string;
}

/**
 * 클라이언트용 User 타입 (camelCase)
 *
 * API 응답에서 사용되는 형태
 * DbUser를 camelCase로 변환한 구조
 */
export interface User {
  id: string;
  providerId: string;
  email: string;
  realName: string;
  phoneNumber: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  nickname: string;
  enlistmentMonth: string; // YYYY-MM format
  rank: Rank;
  unitId: string;
  unitName: string;
  specialty: Specialty;

  // Profile additional fields
  profileImages?: string[]; // Array of profile image URLs (max 4). First image is the main profile photo.
  bio?: string;
  height?: number;
  weight?: number;
  muscleMass?: number;
  bodyFatPercentage?: number;
  interestedLocations?: string[]; // tags
  interestedExercises?: string[]; // tags
  isSmoker?: boolean;
  showInbodyPublic?: boolean;

  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Type Transformers
// ============================================================================

/**
 * DbUser (snake_case) → User (camelCase) 변환
 *
 * @param dbUser - DB에서 조회한 사용자 데이터
 * @returns 클라이언트용 User 객체
 */
export function transformDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    providerId: dbUser.provider_id,
    email: dbUser.email,
    realName: dbUser.real_name,
    phoneNumber: dbUser.phone_number,
    birthDate: dbUser.birth_date,
    gender: dbUser.gender as Gender,
    nickname: dbUser.nickname,
    enlistmentMonth: dbUser.enlistment_month.substring(0, 7), // YYYY-MM-DD → YYYY-MM
    rank: dbUser.rank as Rank,
    unitId: dbUser.unit_id,
    unitName: dbUser.unit_name,
    specialty: dbUser.specialty as Specialty,
    profileImages: dbUser.profile_images ?? undefined,
    bio: dbUser.bio ?? undefined,
    height: dbUser.height_cm ?? undefined,
    weight: dbUser.weight_kg ?? undefined,
    muscleMass: dbUser.skeletal_muscle_mass_kg ?? undefined,
    bodyFatPercentage: dbUser.body_fat_percentage ?? undefined,
    interestedLocations: dbUser.interested_exercise_locations ?? undefined,
    interestedExercises: dbUser.interested_exercise_types ?? undefined,
    isSmoker: dbUser.is_smoker ?? undefined,
    showInbodyPublic: dbUser.show_body_metrics ?? undefined,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

/**
 * DbUser → User 변환 (공개 프로필용, privacy 설정 적용)
 *
 * show_body_metrics가 false인 경우 InBody 데이터 숨김 처리
 *
 * @param dbUser - DB에서 조회한 사용자 데이터
 * @returns privacy 설정이 적용된 User 객체
 */
export function transformDbUserToPublicUser(dbUser: DbUser): User {
  const user = transformDbUserToUser(dbUser);

  // Privacy 설정에 따라 InBody 데이터 숨김
  if (!dbUser.show_body_metrics) {
    user.muscleMass = undefined;
    user.bodyFatPercentage = undefined;
  }

  return user;
}

/**
 * DbUser 배열 → User 배열 변환 (공개 프로필용)
 *
 * @param dbUsers - DB에서 조회한 사용자 배열
 * @returns privacy 설정이 적용된 User 배열
 */
export function transformDbUsersToPublicUsers(dbUsers: DbUser[]): User[] {
  return dbUsers.map(transformDbUserToPublicUser);
}

// ============================================================================
// Signup Flow Types
// ============================================================================

export interface PassVerificationData {
  realName: string;
  phoneNumber: string;
  birthDate: string;
  gender: Gender;
}

export interface MilitaryInfoData {
  enlistmentMonth: string; // YYYY-MM
  rank: Rank;
  unitId: string;
  unitName: string;
  specialty: Specialty;
  nickname: string;
}

export interface SignupCompleteData extends PassVerificationData, MilitaryInfoData {
  providerId: string;
  email: string;
}

// ============================================================================
// Profile Update Types
// ============================================================================

export interface ProfileUpdateData {
  nickname?: string;
  profileImages?: string[];
  bio?: string;
  height?: number;
  weight?: number;
  muscleMass?: number;
  bodyFatPercentage?: number;
  interestedLocations?: string[];
  interestedExercises?: string[];
  isSmoker?: boolean;
  showInbodyPublic?: boolean;
}
