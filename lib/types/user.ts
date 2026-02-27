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

// 계급 상수 & 타입
export const RANKS = ['이병', '일병', '상병', '병장'] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_LABELS: Record<Rank, string> = {
  '이병': '이병',
  '일병': '일병',
  '상병': '상병',
  '병장': '병장',
};

// 병과 상수 & 타입
export const SPECIALTIES = [
  '보병', '포병', '기갑', '공병', '정보통신', '항공',
  '화생방', '병참', '의무', '법무', '행정', '기타',
] as const;
export type Specialty = (typeof SPECIALTIES)[number];

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  '보병': '보병',
  '포병': '포병',
  '기갑': '기갑',
  '공병': '공병',
  '정보통신': '정보통신',
  '항공': '항공',
  '화생방': '화생방',
  '병참': '병참',
  '의무': '의무',
  '법무': '법무',
  '행정': '행정',
  '기타': '기타',
};

export const SPECIALTY_DESCRIPTIONS: Record<Specialty, string> = {
  '보병': '지상 전투의 핵심 병과',
  '포병': '화력 지원 병과',
  '기갑': '전차 및 장갑차 운용',
  '공병': '건설 및 장애물 처리',
  '정보통신': '통신 체계 운용',
  '항공': '항공기 운용 및 정비',
  '화생방': '화학, 생물학, 방사능 방호',
  '병참': '보급 및 군수 지원',
  '의무': '의료 및 위생 지원',
  '법무': '군 법률 업무',
  '행정': '인사 및 행정 업무',
  '기타': '그 외 병과',
};

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
  profilePhotoUrl?: string; // Single profile photo URL
  bio?: string;
  interestedLocations?: string[]; // tags
  interestedExercises?: string[]; // tags
  isSmoker?: boolean;
  showActivityPublic?: boolean;
  showInfoPublic?: boolean;

  createdAt: string;
  updatedAt?: string;

  // Follow counts (공개 프로필 API에서 제공)
  followersCount?: number;
  followingCount?: number;
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
export function toUser(dbUser: DbUser): User {
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
    profilePhotoUrl: dbUser.profile_photo_url ?? undefined,
    bio: dbUser.bio ?? undefined,
    interestedLocations: dbUser.interested_exercise_locations ?? undefined,
    interestedExercises: dbUser.interested_exercise_types ?? undefined,
    isSmoker: dbUser.is_smoker ?? undefined,
    showActivityPublic: dbUser.show_activity_public ?? undefined,
    showInfoPublic: dbUser.show_info_public ?? undefined,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

/**
 * DbUser → User 변환 (공개 프로필용, privacy 설정 적용)
 *
 * show_info_public이 false인 경우 정보 탭 민감 데이터 숨김
 *
 * @param dbUser - DB에서 조회한 사용자 데이터
 * @returns privacy 설정이 적용된 User 객체
 */
export function toPublicUser(dbUser: DbUser): User {
  const user = toUser(dbUser);

  // 정보 탭 비공개 시 민감 데이터 숨김
  if (!dbUser.show_info_public) {
    user.isSmoker = undefined;
  }

  return user;
}

/**
 * DbUser 배열 → User 배열 변환 (공개 프로필용)
 *
 * @param dbUsers - DB에서 조회한 사용자 배열
 * @returns privacy 설정이 적용된 User 배열
 */
export function toPublicUsers(dbUsers: DbUser[]): User[] {
  return dbUsers.map(toPublicUser);
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
  profilePhotoUrl?: string;
  bio?: string;
  interestedLocations?: string[];
  interestedExercises?: string[];
  isSmoker?: boolean;
  showActivityPublic?: boolean;
  showInfoPublic?: boolean;
  rank?: Rank;
  unitName?: string;
  specialty?: Specialty;
}
