'use client';

import FormSection from '@/components/ui/FormSection';
import FormSelect from '@/components/ui/FormSelect';
import { Rank } from '@/lib/types';
import { RANK_OPTIONS } from '@/lib/constants/military';

interface ProfileRankInputProps {
  value: Rank;
  onChange: (value: Rank) => void;
  disabled?: boolean;
}

export default function ProfileRankInput({
  value,
  onChange,
  disabled = false,
}: ProfileRankInputProps) {
  return (
    <FormSection
      title="계급"
      description={disabled ? "복무 정보에서 입력한 계급입니다." : "현재 계급을 선택하세요."}
    >
      <FormSelect
        value={value}
        onChange={(e) => onChange(e.target.value as Rank)}
        options={RANK_OPTIONS}
        disabled={disabled}
      />
    </FormSection>
  );
}
