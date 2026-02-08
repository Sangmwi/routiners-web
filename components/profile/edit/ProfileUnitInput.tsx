'use client';

import FormSection from '@/components/ui/FormSection';
import FormInput from '@/components/ui/FormInput';

interface ProfileUnitInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ProfileUnitInput({
  value,
  onChange,
  disabled = false,
}: ProfileUnitInputProps) {
  return (
    <FormSection
      title="부대명"
      description={disabled ? "복무 정보에서 입력한 부대명이에요." : "소속 부대명을 입력하세요."}
    >
      <FormInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 제1보병사단"
        disabled={disabled}
      />
    </FormSection>
  );
}
