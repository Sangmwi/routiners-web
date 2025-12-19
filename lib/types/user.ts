// User types based on RUTINERS_SIGNUP_PROFILE_UX.md

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

// Full User data structure
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

// Signup flow data
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

// Profile update data
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


