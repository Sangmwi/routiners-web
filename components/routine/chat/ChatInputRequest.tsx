'use client';

import { useState } from 'react';
import { CheckCircleIcon, CircleIcon, CheckSquareIcon, SquareIcon } from '@phosphor-icons/react';
import type { InputRequest } from '@/lib/types/fitness';
import type { InputRequestStatus } from '@/lib/types/chat';

interface ChatInputRequestProps {
  /** 입력 요청 데이터 */
  request: InputRequest;
  /** 메시지 상태 (Phase 9) */
  status?: InputRequestStatus;
  /** 제출된 값 (Phase 20: submitted 상태에서 표시용) */
  submittedValue?: string;
  /** 선택 완료 시 호출 */
  onSubmit: (value: string | string[]) => void;
}

/**
 * AI 선택형 입력 UI 컴포넌트
 *
 * Phase 21: UX 리디자인
 * - Radio: 리스트 스타일 + 라디오 인디케이터
 * - Checkbox: 그리드 스타일 + 체크박스 인디케이터
 * - Slider: 모던 디자인 + 값 강조
 * - Submitted: 최소화 (사용자 메시지와 중복 방지)
 */
export default function ChatInputRequest({
  request,
  status = 'pending',
  submittedValue,
  onSubmit,
}: ChatInputRequestProps) {
  // Radio: 선택된 값 (단일)
  const [selectedRadio, setSelectedRadio] = useState<string | null>(null);

  // Checkbox: 선택된 값들 (다중)
  const [selectedCheckbox, setSelectedCheckbox] = useState<string[]>([]);

  // Slider: 현재 값
  const [sliderValue, setSliderValue] = useState<number>(
    request.sliderConfig?.defaultValue ?? request.sliderConfig?.min ?? 0
  );

  // Radio: 확인 버튼
  const handleRadioSubmit = () => {
    if (selectedRadio) {
      const selected = request.options?.find((o) => o.value === selectedRadio);
      onSubmit(selected?.label || selectedRadio);
    }
  };

  // Checkbox: 토글
  const handleCheckboxToggle = (value: string) => {
    setSelectedCheckbox((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Checkbox: 확인 버튼
  const handleCheckboxSubmit = () => {
    if (selectedCheckbox.length > 0) {
      const selectedLabels = selectedCheckbox.map(
        (v) => request.options?.find((o) => o.value === v)?.label || v
      );
      onSubmit(selectedLabels);
    }
  };

  // Slider: 값 변경
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  // Slider: 확인 버튼
  const handleSliderSubmit = () => {
    const { unit } = request.sliderConfig || { unit: '' };
    onSubmit(`${sliderValue}${unit}`);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 응답 완료 상태 (submitted 또는 answered_via_text)
  // 사용자 메시지 버블이 실제 값을 표시하므로 중복 방지 - 최소 UI만
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'submitted' || status === 'answered_via_text') {
    return (
      <div className="py-2 px-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircleIcon size={14} weight="fill" className="text-green-500" />
          응답 완료
        </span>
      </div>
    );
  }

  // 취소됨 상태 (거의 사용 안 함 - 레거시 호환)
  if (status === 'cancelled') {
    return (
      <div className="py-2 px-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircleIcon size={14} weight="fill" className="text-muted-foreground/50" />
          응답 완료
        </span>
      </div>
    );
  }

  const isActionable = status === 'pending';

  // ═══════════════════════════════════════════════════════════════════════════
  // Radio: 리스트 스타일
  // ═══════════════════════════════════════════════════════════════════════════
  if (request.type === 'radio' && request.options && isActionable) {
    return (
      <div className="py-2">
        {/* 옵션 리스트 */}
        <div className="space-y-1.5 mb-3">
          {request.options.map((option) => {
            const isSelected = selectedRadio === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedRadio(option.value)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  transition-all duration-150
                  ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/30'
                      : 'bg-muted/20 hover:bg-muted/50'
                  }
                `}
              >
                {/* 라디오 인디케이터 */}
                {isSelected ? (
                  <CheckCircleIcon size={20} weight="fill" className="text-primary shrink-0" />
                ) : (
                  <CircleIcon size={20} weight="regular" className="text-muted-foreground/50 shrink-0" />
                )}
                {/* 라벨 */}
                <span
                  className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handleRadioSubmit}
          disabled={!selectedRadio}
          className={`
            w-full py-2.5 rounded-xl text-sm font-medium
            transition-all duration-150
            ${
              selectedRadio
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          선택 완료
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Checkbox: 그리드 스타일
  // ═══════════════════════════════════════════════════════════════════════════
  if (request.type === 'checkbox' && request.options && isActionable) {
    return (
      <div className="py-2">
        {/* 옵션 그리드 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {request.options.map((option) => {
            const isSelected = selectedCheckbox.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => handleCheckboxToggle(option.value)}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-xl text-left
                  transition-all duration-150
                  ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/30'
                      : 'bg-muted/20 hover:bg-muted/50'
                  }
                `}
              >
                {/* 체크박스 인디케이터 */}
                {isSelected ? (
                  <CheckSquareIcon size={18} weight="fill" className="text-primary shrink-0" />
                ) : (
                  <SquareIcon size={18} weight="regular" className="text-muted-foreground/50 shrink-0" />
                )}
                {/* 라벨 */}
                <span
                  className={`text-sm truncate ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handleCheckboxSubmit}
          disabled={selectedCheckbox.length === 0}
          className={`
            w-full py-2.5 rounded-xl text-sm font-medium
            transition-all duration-150
            ${
              selectedCheckbox.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {selectedCheckbox.length > 0
            ? `선택 완료 (${selectedCheckbox.length}개)`
            : '선택해주세요'}
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Slider: 모던 디자인
  // ═══════════════════════════════════════════════════════════════════════════
  if (request.type === 'slider' && request.sliderConfig && isActionable) {
    const { min, max, step, unit } = request.sliderConfig;
    const percentage = ((sliderValue - min) / (max - min)) * 100;

    return (
      <div className="py-2">
        {/* 현재 값 표시 */}
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-foreground">{sliderValue}</span>
          <span className="text-lg text-muted-foreground ml-1">{unit}</span>
        </div>

        {/* 슬라이더 */}
        <div className="relative mb-4 px-1">
          {/* 트랙 배경 */}
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            {/* 채워진 부분 */}
            <div
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* 네이티브 슬라이더 (투명, 위에 겹침) */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* 커스텀 썸 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary rounded-full shadow-md border-2 border-background pointer-events-none transition-all duration-100"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>

        {/* 범위 표시 */}
        <div className="flex justify-between text-xs text-muted-foreground mb-4 px-1">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handleSliderSubmit}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
        >
          선택 완료
        </button>
      </div>
    );
  }

  // 알 수 없는 타입
  return null;
}
