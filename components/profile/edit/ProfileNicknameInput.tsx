'use client';

import { ReactNode } from 'react';
import { WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import FormSection from '@/components/ui/FormSection';
import FormInput from '@/components/ui/FormInput';
import { useCheckNickname, useDebounce } from '@/hooks';

function FieldStatus({
  variant,
  children,
}: {
  variant: 'error' | 'checking' | 'success';
  children: ReactNode;
}) {
  const colorClass =
    variant === 'error' ? 'text-destructive' :
    variant === 'success' ? 'text-primary' :
    'text-muted-foreground';

  return (
    <div className={`flex items-center gap-1 text-xs mt-1 ${colorClass}`}>
      {variant === 'checking' ? (
        <LoadingSpinner size="sm" variant="muted" />
      ) : variant === 'success' ? (
        <CheckCircleIcon size={14} />
      ) : (
        <WarningCircleIcon size={14} />
      )}
      <span>{children}</span>
    </div>
  );
}

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
      return <FieldStatus variant="error">한글, 영문, 숫자, 밑줄(_)만 사용할 수 있어요</FieldStatus>;
    }

    if (trimmed.length > MAX_LENGTH) {
      return <FieldStatus variant="error">최대 {MAX_LENGTH}자까지 입력할 수 있어요</FieldStatus>;
    }

    if (isUnchanged) return null;

    if (isChecking || !isCheckValid) {
      return <FieldStatus variant="checking">확인 중...</FieldStatus>;
    }

    if (isUnavailable) {
      return <FieldStatus variant="error">이미 사용 중인 닉네임이에요</FieldStatus>;
    }

    if (isAvailable) {
      return <FieldStatus variant="success">사용 가능한 닉네임이에요</FieldStatus>;
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
