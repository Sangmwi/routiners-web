'use client';

import { useState, useEffect, useRef } from 'react';
import { UserIcon, WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { useCheckNickname, useDebounce } from '@/hooks';
import { generatePersonalizedNicknames } from '@/lib/utils/nickname';

interface NicknameStepProps {
  initialNickname: string;
  rank: string;
  specialty: string;
  onNext: (nickname: string) => void;
}

const MIN_LENGTH = 2;
const MAX_LENGTH = 12;

/**
 * NicknameStep
 *
 * 닉네임 입력 (토스식)
 * - 실시간 유효성 검사
 * - 중복 체크 (500ms 디바운스)
 * - 개인화된 닉네임 추천
 * - 글자 수 표시
 * - 자동 포커스
 */
export function NicknameStep({
  initialNickname,
  rank,
  specialty,
  onNext,
}: NicknameStepProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 개인화된 닉네임 추천 (마운트 시 1회 생성)
  const [suggestions] = useState(() =>
    generatePersonalizedNicknames({ rank, specialty }, 4)
  );

  // 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const trimmed = nickname.trim();
  const isValidLength = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;
  const hasInvalidChars = /[^가-힣a-zA-Z0-9_]/.test(trimmed);
  const isFormatValid = isValidLength && !hasInvalidChars;

  // 500ms 디바운스 후 중복 체크
  const debouncedNickname = useDebounce(trimmed, 500);
  const {
    data: checkResult,
    isLoading: isChecking,
    isFetched,
  } = useCheckNickname(debouncedNickname, isFormatValid && trimmed.length >= MIN_LENGTH);

  // 현재 입력값과 체크된 값이 일치하는지
  const isCheckValid = debouncedNickname === trimmed;

  // 최종 유효성: 형식 + 중복체크 통과
  const isAvailable = isCheckValid && isFetched && checkResult?.available === true;
  const isUnavailable = isCheckValid && isFetched && checkResult?.available === false;
  const canProceed = isFormatValid && isAvailable && !isChecking;

  const getFormatErrorMessage = () => {
    if (!isTouched || !trimmed) return null;
    if (trimmed.length < MIN_LENGTH) {
      return `최소 ${MIN_LENGTH}자 이상 입력해 주세요`;
    }
    if (trimmed.length > MAX_LENGTH) {
      return `최대 ${MAX_LENGTH}자까지 입력할 수 있어요`;
    }
    if (hasInvalidChars) {
      return '한글, 영문, 숫자, 밑줄(_)만 사용할 수 있어요';
    }
    return null;
  };

  const formatError = getFormatErrorMessage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH + 5) {
      setNickname(value);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  const handleNext = () => {
    if (canProceed) {
      onNext(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canProceed) {
      handleNext();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNickname(suggestion);
    setIsTouched(true);
  };

  // 테두리 색상 결정
  const getBorderClass = () => {
    if (formatError || isUnavailable) {
      return 'border-destructive focus:border-destructive';
    }
    if (isAvailable) {
      return 'border-primary focus:border-primary';
    }
    return 'border-border focus:border-primary';
  };

  // 상태 메시지 렌더링
  const renderStatusMessage = () => {
    // 형식 에러가 있으면 우선 표시
    if (formatError) {
      return (
        <div className="flex items-center gap-1 text-destructive text-sm">
          <WarningCircleIcon size={16} />
          <span>{formatError}</span>
        </div>
      );
    }

    // 체크 중
    if (isFormatValid && (isChecking || !isCheckValid)) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <LoadingSpinner size="sm" variant="muted" />
          <span>확인 중...</span>
        </div>
      );
    }

    // 사용 불가
    if (isUnavailable) {
      return (
        <div className="flex items-center gap-1 text-destructive text-sm">
          <WarningCircleIcon size={16} />
          <span>이미 사용 중인 닉네임이에요</span>
        </div>
      );
    }

    // 사용 가능
    if (isAvailable) {
      return (
        <div className="flex items-center gap-1 text-primary text-sm">
          <CheckCircleIcon size={16} />
          <span>사용 가능한 닉네임이에요</span>
        </div>
      );
    }

    // 기본 안내
    return (
      <div className="text-sm text-muted-foreground">
        한글, 영문, 숫자, 밑줄(_) 사용 가능
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon size={24} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              어떻게 불러드릴까요?
            </h2>
            <p className="text-muted-foreground">
              앱에서 사용할 닉네임을 입력해 주세요
            </p>
          </div>

          {/* Input */}
          <div>
            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={nickname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="닉네임 입력"
                  className={`
                    w-full px-4 py-4 text-lg
                    rounded-xl border-2 transition-all duration-200
                    bg-card text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/20
                    ${getBorderClass()}
                  `}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Character count & status */}
              <div className="flex items-center justify-between px-1">
                {renderStatusMessage()}
                <div
                  className={`text-sm ${
                    trimmed.length > MAX_LENGTH
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {trimmed.length}/{MAX_LENGTH}
                </div>
              </div>
            </div>

            {/* Personalized nickname suggestions */}
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">추천 닉네임</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-muted/50 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 pt-6 pb-safe">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          disabled={!canProceed}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
