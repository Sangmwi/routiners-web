import { Rank, Specialty } from '@/lib/types';

// Rank options (이병/일병/상병/병장)
export const RANK_OPTIONS: { value: Rank; label: string }[] = [
  { value: '이병', label: '이병' },
  { value: '일병', label: '일병' },
  { value: '상병', label: '상병' },
  { value: '병장', label: '병장' },
];

// Specialty options
export const SPECIALTY_OPTIONS: { value: Specialty; label: string }[] = [
  { value: '보병', label: '보병' },
  { value: '포병', label: '포병' },
  { value: '기갑', label: '기갑' },
  { value: '공병', label: '공병' },
  { value: '정보통신', label: '정보통신' },
  { value: '항공', label: '항공' },
  { value: '화생방', label: '화생방' },
  { value: '병참', label: '병참' },
  { value: '의무', label: '의무' },
  { value: '법무', label: '법무' },
  { value: '행정', label: '행정' },
  { value: '기타', label: '기타' },
];

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
