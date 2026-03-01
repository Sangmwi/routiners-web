import { RANKS, RANK_LABELS, SPECIALTIES, SPECIALTY_LABELS, type Rank, type Specialty } from '@/lib/types/user';

// Rank options — user.ts RANKS + RANK_LABELS에서 파생 (단일 소스)
export const RANK_OPTIONS: { value: Rank; label: string }[] = RANKS.map((rank) => ({
  value: rank,
  label: RANK_LABELS[rank],
}));

// Specialty options — user.ts SPECIALTIES + SPECIALTY_LABELS에서 파생 (단일 소스)
export const SPECIALTY_OPTIONS: { value: Specialty; label: string }[] = SPECIALTIES.map((specialty) => ({
  value: specialty,
  label: SPECIALTY_LABELS[specialty],
}));

// Generate years for enlistment (last 3 years + current year + next year)
export const getEnlistmentYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
};

// Months
export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `${i + 1}월`,
}));

// Validate enlistment date against rank
export const validateEnlistmentAndRank = (
  enlistmentMonth: string,
  rank: Rank
): { valid: boolean; message?: string } => {
  const [year, month] = enlistmentMonth.split('-').map(Number);
  const enlistmentDate = new Date(year, month - 1);
  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - enlistmentDate.getFullYear()) * 12 +
    (now.getMonth() - enlistmentDate.getMonth());

  // Basic validation rules (simplified)
  if (monthsDiff < 0) {
    return { valid: false, message: '입대 시기가 미래일 수 없어요.' };
  }

  if (rank === '이병' && monthsDiff > 6) {
    return { valid: false, message: '입대 시기와 계급이 맞지 않아요.' };
  }

  if (rank === '일병' && (monthsDiff < 6 || monthsDiff > 12)) {
    return { valid: false, message: '입대 시기와 계급이 맞지 않아요.' };
  }

  if (rank === '상병' && (monthsDiff < 12 || monthsDiff > 18)) {
    return { valid: false, message: '입대 시기와 계급이 맞지 않아요.' };
  }

  if (rank === '병장' && monthsDiff < 18) {
    return { valid: false, message: '입대 시기와 계급이 맞지 않아요.' };
  }

  return { valid: true };
};
