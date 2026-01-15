'use client';

import { useState, useEffect, useRef } from 'react';
import { User, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface NicknameStepProps {
  initialNickname: string;
  onNext: (nickname: string) => void;
}

const MIN_LENGTH = 2;
const MAX_LENGTH = 12;

/**
 * NicknameStep
 *
 * 닉네임 입력 (토스식)
 * - 실시간 유효성 검사
 * - 글자 수 표시
 * - 자동 포커스
 */
export function NicknameStep({ initialNickname, onNext }: NicknameStepProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const isValid = isValidLength && !hasInvalidChars;

  const getErrorMessage = () => {
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

  const errorMessage = getErrorMessage();

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
    if (isValid) {
      onNext(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      handleNext();
    }
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
                <User className="w-6 h-6 text-primary" />
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
                    ${
                      errorMessage
                        ? 'border-destructive focus:border-destructive'
                        : nickname && isValid
                          ? 'border-primary focus:border-primary'
                          : 'border-border focus:border-primary'
                    }
                  `}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Character count & error */}
              <div className="flex items-center justify-between px-1">
                {errorMessage ? (
                  <div className="flex items-center gap-1 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    한글, 영문, 숫자, 밑줄(_) 사용 가능
                  </div>
                )}
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

            {/* Example nicknames */}
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">추천 닉네임</p>
              <div className="flex flex-wrap gap-2">
                {['운동하는병사', '헬스왕', '근육맨', '피지컬킹'].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setNickname(example);
                      setIsTouched(true);
                    }}
                    className="px-3 py-1.5 rounded-full bg-muted/50 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {example}
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
          disabled={!isValid}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
