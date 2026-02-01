'use client';

import { useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import type { InputRequest } from '@/lib/types/fitness';
import type { InputRequestStatus } from '@/lib/types/chat';

interface ChatInputRequestProps {
  /** 입력 요청 데이터 */
  request: InputRequest;
  /** 메시지 상태 (Phase 9) */
  status?: InputRequestStatus;
  /** 선택 완료 시 호출 */
  onSubmit: (value: string | string[]) => void;
}

/**
 * AI 선택형 입력 UI 컴포넌트
 *
 * Phase 9: status prop 추가
 * - pending: 버튼 활성화
 * - submitted: 제출된 값 표시
 * - cancelled: 취소됨 표시
 *
 * 모든 타입에서 선택 후 확인 버튼으로 전송
 * - radio: 단일 선택 후 확인
 * - checkbox: 다중 선택 후 확인
 * - slider: 값 조정 후 확인
 */
export default function ChatInputRequest({ request, status = 'pending', onSubmit }: ChatInputRequestProps) {
  // Radio: 선택된 값 (단일)
  const [selectedRadio, setSelectedRadio] = useState<string | null>(null);

  // Checkbox: 선택된 값들 (다중)
  const [selectedCheckbox, setSelectedCheckbox] = useState<string[]>([]);

  // Slider: 현재 값
  const [sliderValue, setSliderValue] = useState<number>(
    request.sliderConfig?.defaultValue ?? request.sliderConfig?.min ?? 0
  );

  // Radio: 선택
  const handleRadioSelect = (value: string) => {
    setSelectedRadio(value);
  };

  // Radio: 확인 버튼
  const handleRadioSubmit = () => {
    if (selectedRadio) {
      // label로 전송 (AI가 이해하기 쉽게)
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
      // label들로 전송
      const selectedLabels = selectedCheckbox
        .map((v) => request.options?.find((o) => o.value === v)?.label || v);
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

  const isActionable = status === 'pending';

  // 제출됨 상태: 선택된 값만 표시
  if (status === 'submitted') {
    return (
      <div className="py-3 px-1 opacity-75">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
            <CheckIcon size={12} weight="bold" />
            제출됨
          </span>
        </div>
        {/* 선택된 값 표시 (읽기 전용) */}
        <div className="flex flex-wrap gap-2">
          {request.options?.map((option) => (
            <span
              key={option.value}
              className="px-4 py-2 rounded-full text-sm font-medium bg-muted/50 text-muted-foreground"
            >
              {option.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // 취소됨 상태
  if (status === 'cancelled') {
    return (
      <div className="py-3 px-1 opacity-50">
        <span className="text-xs text-muted-foreground">입력이 취소되었습니다</span>
      </div>
    );
  }

  return (
    <div className="py-3 px-1">
      {/* Radio 버튼 */}
      {request.type === 'radio' && request.options && isActionable && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {request.options.map((option) => {
              const isSelected = selectedRadio === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleRadioSelect(option.value)}
                  className={
                    isSelected
                      ? 'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 border bg-primary text-primary-foreground border-primary'
                      : 'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {selectedRadio && (
            <button
              onClick={handleRadioSubmit}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors duration-150"
            >
              선택 완료
            </button>
          )}
        </div>
      )}

      {/* Checkbox 버튼 */}
      {request.type === 'checkbox' && request.options && isActionable && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {request.options.map((option) => {
              const isSelected = selectedCheckbox.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => handleCheckboxToggle(option.value)}
                  className={
                    isSelected
                      ? 'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 border bg-primary text-primary-foreground border-primary'
                      : 'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {selectedCheckbox.length > 0 && (
            <button
              onClick={handleCheckboxSubmit}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors duration-150"
            >
              선택 완료 ({selectedCheckbox.length}개)
            </button>
          )}
        </div>
      )}

      {/* Slider */}
      {request.type === 'slider' && request.sliderConfig && isActionable && (
        <div className="space-y-3 px-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {request.sliderConfig.min}
              {request.sliderConfig.unit}
            </span>
            <span className="text-lg font-semibold text-foreground">
              {sliderValue}
              {request.sliderConfig.unit}
            </span>
            <span>
              {request.sliderConfig.max}
              {request.sliderConfig.unit}
            </span>
          </div>
          <input
            type="range"
            min={request.sliderConfig.min}
            max={request.sliderConfig.max}
            step={request.sliderConfig.step}
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <button
            onClick={handleSliderSubmit}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors duration-150"
          >
            선택 완료
          </button>
        </div>
      )}
    </div>
  );
}
