'use client';

import { WarningCircleIcon, CheckCircleIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import FormSection from '@/components/ui/FormSection';
import FormInput from '@/components/ui/FormInput';
import { useCheckNickname, useDebounce } from '@/hooks';

const MIN_LENGTH = 2;
const MAX_LENGTH = 12;

interface ProfileNicknameInputProps {
  value: string;
  originalNickname: string;
  userId: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function ProfileNicknameInput({
  value,
  originalNickname,
  userId,
  onChange,
  error,
}: ProfileNicknameInputProps) {
  const trimmed = value.trim();
  const isUnchanged = trimmed === originalNickname;
  const isValidLength = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;
  const hasInvalidChars = /[^가-힣a-zA-Z0-9_]/.test(trimmed);
  const isFormatValid = isValidLength && !hasInvalidChars;

  // 변경된 경우에만 디바운스 중복체크
  const debouncedNickname = useDebounce(trimmed, 500);
  const shouldCheck = isFormatValid && !isUnchanged;
  const {
    data: checkResult,
    isLoading: isChecking,
    isFetched,
  } = useCheckNickname(debouncedNickname, shouldCheck, userId);

  const isCheckValid = debouncedNickname === trimmed;
  const isAvailable = isCheckValid && isFetched && checkResult?.available === true;
  const isUnavailable = isCheckValid && isFetched && checkResult?.available === false;

  const renderStatus = () => {
    if (!trimmed || trimmed.length < MIN_LENGTH) return null;

    if (hasInvalidChars) {
      return (
        <div className="flex items-center gap-1 text-destructive text-xs mt-1">
          <WarningCircleIcon size={14} />
          <span>한글, 영문, 숫자, 밑줄(_)만 사용할 수 있어요</span>
        </div>
      );
    }

    if (trimmed.length > MAX_LENGTH) {
      return (
        <div className="flex items-center gap-1 text-destructive text-xs mt-1">
          <WarningCircleIcon size={14} />
          <span>최대 {MAX_LENGTH}자까지 입력할 수 있어요</span>
        </div>
      );
    }

    if (isUnchanged) return null;

    if (isChecking || !isCheckValid) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
          <SpinnerGapIcon size={14} className="animate-spin" />
          <span>확인 중...</span>
        </div>
      );
    }

    if (isUnavailable) {
      return (
        <div className="flex items-center gap-1 text-destructive text-xs mt-1">
          <WarningCircleIcon size={14} />
          <span>이미 사용 중인 닉네임이에요</span>
        </div>
      );
    }

    if (isAvailable) {
      return (
        <div className="flex items-center gap-1 text-primary text-xs mt-1">
          <CheckCircleIcon size={14} />
          <span>사용 가능한 닉네임이에요</span>
        </div>
      );
    }

    return null;
  };

  return (
    <FormSection
      title="닉네임"
      description="다른 사용자에게 표시될 닉네임을 설정하세요."
    >
      <FormInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="닉네임을 입력하세요"
        error={error}
        maxLength={20}
      />
      {renderStatus()}
    </FormSection>
  );
}
