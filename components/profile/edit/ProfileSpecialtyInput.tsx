'use client';

import FormSection from '@/components/ui/FormSection';
import FormSelect from '@/components/ui/FormSelect';
import { Specialty } from '@/lib/types';

interface ProfileSpecialtyInputProps {
  value: Specialty;
  onChange: (value: Specialty) => void;
  disabled?: boolean;
}

const SPECIALTY_OPTIONS: { value: Specialty; label: string }[] = [
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

export default function ProfileSpecialtyInput({
  value,
  onChange,
  disabled = false,
}: ProfileSpecialtyInputProps) {
  return (
    <FormSection
      title="병과"
      description={disabled ? "복무 정보에서 입력한 병과예요." : "소속 병과를 선택하세요."}
    >
      <FormSelect
        value={value}
        onChange={(e) => onChange(e.target.value as Specialty)}
        options={SPECIALTY_OPTIONS}
        disabled={disabled}
      />
    </FormSection>
  );
}
